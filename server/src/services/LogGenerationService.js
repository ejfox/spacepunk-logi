import { query } from '../db/index.js';

export class LogGenerationService {
  constructor(openRouterApiKey = null) {
    this.apiKey = openRouterApiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.defaultModel = 'anthropic/claude-3-sonnet';
  }

  /**
   * Generate a ship's log entry for a specific time period
   */
  async generateLogEntry(shipId, tickRangeStart, tickRangeEnd) {
    console.log(`Generating log entry for ship ${shipId}, ticks ${tickRangeStart}-${tickRangeEnd}`);
    
    try {
      // 1. Gather events from this period
      const events = await this.gatherLogEvents(shipId, tickRangeStart, tickRangeEnd);
      
      if (events.length === 0) {
        console.log('No events found for log generation period');
        return null;
      }

      // 2. Get ship and crew context
      const context = await this.gatherShipContext(shipId);
      
      // 3. Get captain's preferences
      const preferences = await this.getLogPreferences(context.player_id);
      
      // 4. Generate the log entry using LLM
      const logContent = await this.generateLogWithLLM(events, context, preferences);
      
      // 5. Save the log entry
      const logEntry = await this.saveLogEntry(
        shipId, 
        logContent, 
        tickRangeStart, 
        tickRangeEnd, 
        events.length
      );
      
      // 6. Mark events as processed
      await this.markEventsProcessed(events.map(e => e.id), logEntry.id);
      
      console.log(`Generated log entry ${logEntry.id} for ship ${shipId}`);
      return logEntry;
      
    } catch (error) {
      console.error('Error generating log entry:', error);
      throw error;
    }
  }

  /**
   * Gather all log events for a ship within a tick range
   */
  async gatherLogEvents(shipId, tickStart, tickEnd) {
    const result = await query(`
      SELECT 
        id,
        event_type,
        category,
        severity,
        event_title,
        event_description,
        event_data,
        crew_member_ids,
        impact_score,
        narrative_tags,
        tick_number,
        created_at
      FROM log_events 
      WHERE ship_id = $1 
        AND tick_number BETWEEN $2 AND $3
        AND processed_in_log_entry IS NULL
      ORDER BY tick_number ASC, impact_score DESC
    `, [shipId, tickStart, tickEnd]);
    
    return result.rows;
  }

  /**
   * Get ship and crew context for narrative generation
   */
  async gatherShipContext(shipId) {
    // Get ship details
    const shipResult = await query(`
      SELECT s.*, p.username, p.deaths 
      FROM ships s 
      JOIN players p ON s.player_id = p.id 
      WHERE s.id = $1
    `, [shipId]);
    
    if (shipResult.rows.length === 0) {
      throw new Error(`Ship ${shipId} not found`);
    }
    
    const ship = shipResult.rows[0];
    
    // Get crew members
    const crewResult = await query(`
      SELECT 
        name,
        age,
        homeworld,
        culture,
        skill_engineering,
        skill_piloting,
        skill_social,
        skill_combat,
        trait_bravery,
        trait_loyalty,
        trait_ambition,
        trait_work_ethic,
        health,
        morale,
        fatigue
      FROM crew_members 
      WHERE ship_id = $1 AND died_at IS NULL
      ORDER BY hired_at ASC
    `, [shipId]);
    
    return {
      ...ship,
      crew: crewResult.rows
    };
  }

  /**
   * Get captain's log generation preferences
   */
  async getLogPreferences(playerId) {
    const result = await query(`
      SELECT * FROM log_preferences WHERE player_id = $1
    `, [playerId]);
    
    // Return defaults if no preferences set
    if (result.rows.length === 0) {
      return {
        detail_level: 'normal',
        include_crew_gossip: true,
        include_technical_details: true,
        include_market_analysis: true,
        narrative_style: 'professional',
        perspective: 'third_person',
        min_event_impact: 3
      };
    }
    
    return result.rows[0];
  }

  /**
   * Generate log content using LLM
   */
  async generateLogWithLLM(events, context, preferences) {
    if (!this.apiKey) {
      // Fallback for development - generate basic log without LLM
      return this.generateFallbackLog(events, context);
    }

    const prompt = this.buildLogPrompt(events, context, preferences);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'spacepunk-logistics-sim'
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${data.error?.message || 'Unknown error'}`);
      }

      return {
        title: this.extractTitle(data.choices[0].message.content),
        content: data.choices[0].message.content,
        llm_model: this.defaultModel,
        token_count: data.usage?.total_tokens || 0
      };
      
    } catch (error) {
      console.error('LLM generation failed, using fallback:', error);
      return this.generateFallbackLog(events, context);
    }
  }

  /**
   * System prompt for LLM log generation
   */
  getSystemPrompt() {
    return `You are the ship's computer generating a captain's log entry for a space logistics vessel. 

Your writing style should be:
- Professional but with subtle bureaucratic cynicism
- Focus on practical details and crew interactions
- Treat extraordinary space events as mundane business operations
- Include specific names, numbers, and technical details
- Write from third person perspective about the ship's operations

The universe is "spacepunk" - a cynical, bureaucratic space future where epic space adventures are treated like tedious paperwork. Think "The Office" meets "Firefly".

Format your response as a proper ship's log entry with a title and detailed content. Make it feel like it was generated by corporate-issued ship management software.`;
  }

  /**
   * Build the specific prompt for this log entry
   */
  buildLogPrompt(events, context, preferences) {
    const crewSummary = context.crew.map(c => 
      `${c.name} (${c.age}, ${c.homeworld}) - Engineering: ${c.skill_engineering}, Piloting: ${c.skill_piloting}, Morale: ${c.morale}%`
    ).join('\n');

    const eventsSummary = events.map(e => 
      `${e.event_type}: ${e.event_title} (Impact: ${e.impact_score}/10)`
    ).join('\n');

    return `Ship: "${context.name}" (${context.hull_type})
Captain: ${context.username} (Deaths: ${context.deaths})
Location: ${context.location_station || 'Deep Space'}
Status: Fuel ${context.fuel_current}/${context.fuel_max}, Cargo ${context.cargo_used}/${context.cargo_max}

Crew Roster:
${crewSummary}

Recent Events:
${eventsSummary}

Generate a ship's log entry covering these events. Focus on crew interactions, operational details, and the mundane reality of space logistics. Keep the tone professional but slightly weary, as if written by overworked ship management software.`;
  }

  /**
   * Fallback log generation when LLM is unavailable
   */
  generateFallbackLog(events, context) {
    const highImpactEvents = events.filter(e => e.impact_score >= 5);
    const crewEvents = events.filter(e => e.category === 'crew');
    
    let content = `Ship's Log - ${context.name}\n`;
    content += `Location: ${context.location_station || 'Deep Space'}\n`;
    content += `Crew Status: ${context.crew.length} active personnel\n\n`;
    
    if (highImpactEvents.length > 0) {
      content += `Notable Events:\n`;
      highImpactEvents.forEach(event => {
        content += `- ${event.event_title}\n`;
      });
      content += '\n';
    }
    
    if (crewEvents.length > 0) {
      content += `Crew Activities:\n`;
      crewEvents.slice(0, 3).forEach(event => {
        content += `- ${event.event_description || event.event_title}\n`;
      });
    }
    
    content += '\nSystem Status: Operational\n';
    content += `Fuel: ${context.fuel_current}/${context.fuel_max} units\n`;
    content += `Cargo: ${context.cargo_used}/${context.cargo_max} capacity used\n`;
    
    return {
      title: `Operations Report - ${new Date().toISOString().split('T')[0]}`,
      content: content,
      llm_model: 'fallback',
      token_count: 0
    };
  }

  /**
   * Extract title from LLM response
   */
  extractTitle(content) {
    const lines = content.split('\n');
    const titleLine = lines.find(line => 
      line.includes('Log') || 
      line.includes('Report') || 
      line.includes('Entry') ||
      line.startsWith('#')
    );
    
    if (titleLine) {
      return titleLine.replace(/^#+\s*/, '').trim();
    }
    
    return `Ship's Log - ${new Date().toISOString().split('T')[0]}`;
  }

  /**
   * Save the generated log entry to database
   */
  async saveLogEntry(shipId, logContent, tickStart, tickEnd, eventsProcessed) {
    // Get next entry number for this ship
    const entryNumberResult = await query(`
      SELECT COALESCE(MAX(entry_number), 0) + 1 as next_number
      FROM ship_log_entries 
      WHERE ship_id = $1
    `, [shipId]);
    
    const entryNumber = entryNumberResult.rows[0].next_number;
    
    // Calculate time period
    const periodStart = new Date(Date.now() - (tickEnd - tickStart) * 30000); // Assuming 30s ticks
    const periodEnd = new Date();
    
    const result = await query(`
      INSERT INTO ship_log_entries (
        ship_id,
        entry_number,
        title,
        content,
        tick_range_start,
        tick_range_end,
        events_processed,
        llm_model,
        token_count,
        period_start,
        period_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      shipId,
      entryNumber,
      logContent.title,
      logContent.content,
      tickStart,
      tickEnd,
      eventsProcessed,
      logContent.llm_model,
      logContent.token_count,
      periodStart,
      periodEnd
    ]);
    
    return result.rows[0];
  }

  /**
   * Mark events as processed in a log entry
   */
  async markEventsProcessed(eventIds, logEntryId) {
    if (eventIds.length === 0) return;
    
    await query(`
      UPDATE log_events 
      SET processed_in_log_entry = $1 
      WHERE id = ANY($2)
    `, [logEntryId, eventIds]);
  }

  /**
   * Add a log event for future processing
   */
  async addLogEvent(shipId, tickNumber, eventType, category, eventTitle, eventDescription = null, eventData = {}, options = {}) {
    const {
      severity = 'info',
      crewMemberIds = [],
      relatedEntityId = null,
      relatedEntityType = null,
      impactScore = 1,
      narrativeTags = []
    } = options;

    await query(`
      INSERT INTO log_events (
        ship_id,
        tick_number,
        event_type,
        category,
        severity,
        event_title,
        event_description,
        event_data,
        crew_member_ids,
        related_entity_id,
        related_entity_type,
        impact_score,
        narrative_tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      shipId,
      tickNumber,
      eventType,
      category,
      severity,
      eventTitle,
      eventDescription,
      JSON.stringify(eventData),
      crewMemberIds,
      relatedEntityId,
      relatedEntityType,
      impactScore,
      narrativeTags
    ]);
  }

  /**
   * Get recent log entries for a ship
   */
  async getRecentLogEntries(shipId, limit = 10) {
    const result = await query(`
      SELECT 
        id,
        entry_number,
        title,
        content,
        tick_range_start,
        tick_range_end,
        events_processed,
        generated_at,
        is_read
      FROM ship_log_entries 
      WHERE ship_id = $1 
      ORDER BY entry_number DESC 
      LIMIT $2
    `, [shipId, limit]);
    
    return result.rows;
  }

  /**
   * Mark log entries as read
   */
  async markLogEntriesRead(logEntryIds) {
    if (logEntryIds.length === 0) return;
    
    await query(`
      UPDATE ship_log_entries 
      SET is_read = true 
      WHERE id = ANY($1)
    `, [logEntryIds]);
  }
}

export default LogGenerationService;