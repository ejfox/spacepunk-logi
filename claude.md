To explain "Spacepunk" to your development team and help them get something going without over-complicating it, focus on these core ideas:

**Game Title & Core Identity:**
"Team, we're building **Spacepunk**. Think of it as a **space logistics simulation** where you're running a slightly broken, bureaucratic space trucking company. It's a server-authoritative game where everything happens on a 'tick' (a short time step) that updates the whole universe every few seconds."

**The Big Idea: Your Interface _IS_ the Story:**
"This is the most crucial concept: **the game's user interface (UI) isn't just a pretty skin; it's a core part of the game's identity and humor.**"

- **Terrible Enterprise Software:** It's designed to look like "terrible corporate-issued ship management software" with "zero-CSS brutalism". This isn't laziness; it's canonical world-building. Managing your ship should feel like "filing digital paperwork".
- **Progressive Software Licensing:** Players start with a very basic UI (just 3 buttons). As they upgrade their ship, they're actually "purchasing software licenses" that **unlock new, ugly interface tabs**. The UI gets _more_ complicated and information-dense as the player progresses, reflecting "earned complexity".
- **Computer Personality Decay:** The UI itself can develop quirks over time, like buttons needing double-clicks or passive-aggressive error messages, adding to the game's cynical humor.

**Your Crew: They're (Almost) Real People:**
"You, the player-captain, are isolated in your quarters and don't directly control the ship or crew. Instead, you manage everything through an 'indirect command structure'."

- **Dwarf Fortress-Depth:** Your crew members have deep personalities, skills, and relationships. They remember how you treat them.
- **Autonomous Behavior:** Crew members make independent decisions every game tick based on their traits, opinions, and stress levels. This leads to emergent, often chaotic or darkly humorous situations (e.g., "Chen's Drunk Again", "The Coffee Machine Saga").
- **Generational Memory:** A key innovation is that **crew members persist in the universe after your player character dies**. They'll remember your previous captain and how you treated them, influencing interactions with your new character across different "lives".

**The Core Loop: Get This Working First (MVP)!**
"For the initial Minimum Viable Product (MVP), focus on getting these fundamental interactions implemented:"

1.  "**Hire crew** from randomly generated pools at different stations."
2.  "**Trade resources** between galaxies using those deliberately ugly HTML forms."
3.  "**Upgrade your ship's software** to unlock new, more complex interface tabs."
4.  "**Set crew training goals** (e.g., 'Torres: Advanced Reactor Theory') before you log off. Their skills will develop in real-time, even when you're not playing."
5.  "When you log back in, the game will provide **LLM-generated ship's log summaries**. These are beautifully written narratives that explain what happened during your absence, weaving together actual crew skill progressions, market fluctuations, and crew relationships into personalized stories."
6.  "**Experience permadeath and restart**, but remember that surviving crew members carry memories of your past actions into your new game."

**Emergent Stories & The Humor (The Vibe):**
"The game's humor comes from treating incredible cosmic events and abilities with mundane, bureaucratic, and often cynical workplace language. Traits are hilariously banal, like 'Good With Engines' for someone who can warp reality with a wrench. The LLM system isn't just for missions; it generates the 'flavor text' for ship logs, news, and crew dialogue, constantly injecting this unique personality."
"This combination of systemic depth and a cynical, bureaucratic aesthetic is what makes 'Spacepunk' unique. The goal is to make players feel like they're managing a very real, very frustrating, and often absurd space business, where epic space operas emerge from mundane spreadsheets and crew gossip."

## GENERATIVE CONTENT SYSTEM MASTER PLAN 🎲

**VISION:** Everything qualitative in Spacepunk should be LLM-generated with chance.js seeding for consistency. No more hardcoded strings - pure procedural generation with corporate cynicism.

### **GENERATIVE CONTENT ARCHITECTURE:**
```
/generative-content/
├── templates/           # LLM prompt templates for all content types
│   ├── crew/           # Names, backstories, employment notes, traits descriptions
│   ├── ships/          # Ship names, status messages, maintenance logs
│   ├── stations/       # Station names, descriptions, corporate announcements  
│   ├── markets/        # Resource names, market commentary, price explanations
│   ├── missions/       # Mission titles, descriptions, corporate jargon
│   ├── logs/           # Ship's log entries, system messages, alerts
│   └── world/          # Faction names, planet descriptions, news headlines
├── datasets/           # CSV/JSON source data for chance.js sampling
│   ├── name-parts.csv  # Prefixes, suffixes, corporate buzzwords
│   ├── locations.json  # Homeworlds, stations, sectors with cultural data
│   ├── resources.csv   # Base resource types, categories, corporate names
│   ├── corporations.json # Company names, slogans, corporate personalities
│   └── archetypes.json # Jungian trait descriptions, corporate euphemisms
├── generators/         # Specialized content generation classes
│   ├── CrewGenerator.js     # Names + LLM backstories
│   ├── ShipStatusGenerator.js # Technical status + LLM flavor
│   ├── MarketGenerator.js   # Resource names + LLM market commentary
│   ├── NewsGenerator.js     # Procedural galactic news with corporate spin
│   └── WorldGenerator.js    # Stations, factions, locations
└── cache/              # Pre-generated content for performance
    ├── crew-names/     # Common name combinations
    ├── ship-statuses/  # Standard maintenance messages
    └── market-flavor/  # Price change explanations
```

### **IMPLEMENTATION STRATEGY:**

**PHASE 1: Data Extraction & Templates** ⚡
- [ ] Extract all hardcoded strings from codebase into CSV/JSON datasets
- [ ] Create LLM prompt templates for each content type with corporate tone guidelines
- [ ] Build base generator classes with chance.js + LLM integration

**PHASE 2: Core Content Systems** 🏗️  
- [ ] CrewGenerator: Names from datasets + LLM backstories with archetype integration
- [ ] ShipStatusGenerator: Technical readings + LLM maintenance humor
- [ ] MarketGenerator: Resource names + LLM price commentary with faction influences

**PHASE 3: World Building** 🌌
- [ ] NewsGenerator: Procedural galactic events with corporate PR spin
- [ ] WorldGenerator: Station names, faction descriptions, planetary lore
- [ ] EventGenerator: Random incidents, crew interactions, system failures

**PHASE 4: Performance & Caching** ⚡
- [ ] Pre-generate common content during server startup
- [ ] Smart caching with seeded regeneration for consistency
- [ ] Async generation pipeline for complex content

### **CONTENT GENERATION PRINCIPLES:**
1. **Chance.js First:** All randomness must be seeded for deterministic results
2. **LLM Enhancement:** Use AI to transform data selections into rich narrative
3. **Corporate Cynicism:** Every string should feel like "terrible enterprise software"
4. **Modular Templates:** Reusable prompt patterns across content types
5. **Cultural Consistency:** Generated content respects crew cultural backgrounds
6. **Performance Balance:** Pre-generate expensive content, generate simple content on-demand

## Current Implementation Status (June 2025)

**📋 OUTSTANDING GITHUB ISSUES STATUS:**
*[NOTE: Always check `gh issue list` before planning next moves]*

**🔴 CRITICAL ISSUES STILL OPEN:**
- #45-48: Permadeath system (triggers, survival, post-death, reputation inheritance)
- #53-56: Trait system expansion (database tables, Level 1 definitions, effects, Level 3 corruption)
- #41-44: Progressive UI complexity (tab unlocking, density scaling, brutalist components)
- #49-51: Intel/information propagation system
- #58-61: Enhanced narrative systems (impact tracking, status displays)

**✅ ISSUES EFFECTIVELY COMPLETED (Need Closing):**
- #58: LLM-Generated Ship's Log Summaries ✅ 
- #57: Real-Time Training Queues ✅
- #60-61: Tick Counter & Status Bar ✅
- #43-44: Brutalist UI Components ✅

**✅ FULLY COMPLETED MVP SYSTEMS:**
- **Complete Brutalist UI System:** Atomic component library with progressive unlocking (BASIC → STANDARD → PROFESSIONAL licenses)
- **Market Trading System:** Real-time price simulation with ASCII sparklines and faction-based pricing
- **Mission Generator:** LLM-powered procedural objectives with template fallbacks and corporate humor
- **LLM-Generated Ship's Logs:** Complete narrative generation transforming crew activities into stories
- **Real-Time Training Queues:** Offline progression with hacker skill tree (lockpicking, social engineering, biohacking)
- **Tick Engine:** Server-authoritative game loop processing all systems every 30 seconds
- **WebSocket Integration:** Real-time updates for all game systems

**🔥 NEXT 3 STRATEGIC MOVES:**

### **MOVE 1: Software License Purchase System** ⚡ *[HIGH PRIORITY]*
**Goal:** Complete the progressive UI unlocking mechanic that defines Spacepunk's identity
**Implementation:**
- Add license purchase API endpoints with credit costs (BASIC=free, STANDARD=5000cr, PROFESSIONAL=25000cr)
- Implement license validation middleware for tab access
- Create "Software Upgrade Terminal" in Ship Systems tab with corporate jargon ("Enterprise License Agreement", "Terms of Service", etc.)
- Add passive-aggressive upgrade prompts ("Your current license limits productivity. Consider upgrading for optimal workflow synergy.")

### **MOVE 2: Permadeath & Crew Memory System** 💀 *[CORE MECHANIC]*
**Goal:** Implement the generational memory system that makes Spacepunk unique
**Implementation:**
- Create player death triggers (health system, mission failures, crew mutiny)
- Build crew survival determination algorithms based on loyalty/relationship scores
- Implement memory inheritance system where surviving crew remember previous captains
- Design "New Captain" character creation that shows inherited crew relationships
- Add memorial system where dead captains become part of ship lore

### **MOVE 3: Enhanced Trait System (Levels 2-3)** 🧬 *[DEPTH EXPANSION]*
**Goal:** Add rare/corrupted traits that create emergent gameplay and narrative depth
**Implementation:**
- Design Level 2 traits (10% spawn rate): "Caffeinated Beyond Reason", "Bureaucracy Whisperer", "Void Touched"
- Create Level 3 corrupted traits (2% spawn rate): "Third Arm Efficiency", "Temporal Displacement Syndrome", "Corporate Stockholm Syndrome"
- Implement trait evolution through extreme training or mission outcomes
- Add trait-specific dialogue and ship's log narrative hooks

**🎮 CURRENT GAME LOOP:**
Players start with BASIC license → hire crew → set training goals → accept missions → upgrade software licenses → unlock complex features → experience permadeath → inherit crew memories → repeat with enhanced relationships. **THE FULL SPACEPUNK EXPERIENCE IS 90% COMPLETE.**

Here is a document outlining the requirements, ideas, goals, and acceptance criteria for the Spacepunk Logistics Sim character and avatar generation system, designed to integrate seamlessly with the game's brutalist aesthetic and deep simulation mechanics.

---

## Spacepunk Logistics Sim: Character + Avatar Generation System
### Technical Design Document

**Date:** 2025-XX-XX
**Version:** 1.0
**Author:** [Your Name/Team]

---

### **I. Executive Summary**

This document details the requirements and design for the `Spacepunk Logistics Sim` character and avatar generation system. Unlike traditional detailed character portraits, these avatars will serve as **abstract, data-driven visual representations** of crew members, aligning with the game's brutalist HTML interface and its core philosophy of treating extraordinary abilities as mundane workplace skills [Previous Response, 72, 102]. The system will prioritize **functional abstraction, emergent identity, and efficient, programmatic generation**, leveraging existing data schemas and fitting seamlessly into the game's "earned complexity" UI philosophy [Previous Response, 13].

### **II. Goals**

The primary goals for the avatar generation system are:

1.  **Functional Abstraction:** Create visual representations of crew members that are abstract data visualizations rather than detailed portraits, reinforcing the game's "simulation substrate" meta-narrative [Previous Response, 97, 103].
2.  **Data-Driven:** Avatars must dynamically reflect the most salient data points of a crew member, including their skills, personality, cultural background, status, and traits [Previous Response, 7, 8, 15].
3.  **Aesthetic Alignment:** The avatars must adhere to the "zero-CSS brutalism" interface philosophy, appearing as unstyled, functional HTML elements that hint at underlying computational reality [Previous Response, 102, 136, 144].
4.  **Emergent Identity:** Over time, as crew members evolve through player interaction and experience, their avatars should subtly change to reflect their progression and unique history within the simulation [Previous Response, 6, 7].
5.  **Progressive Revelation:** The detail and information density visible in an avatar should scale with the player's "earned complexity" and meta-knowledge traits, making the avatar itself an evolving UI element [Previous Response, 13, 79, 80].
6.  **Efficiency:** The generation process must be server-side, lightweight, and performant enough to integrate into the regular tick updates without causing significant load or latency [Previous Response, 3, 4, 144].

### **III. Core Philosophy: Functional Abstraction as "Avatar"**

The `Spacepunk Logistics Sim` avatar generator will not produce photorealistic images. Instead, it will generate **dynamic SVG "data visualizations"** of each crew member [Previous Response]. This approach aligns with the game's brutalist interface, where "managing a spaceship feels like filing digital paperwork" and the "crude interface hints at the underlying computational reality".

Each avatar will be a lightweight, scalable SVG composition, assembled server-side and rendered client-side, serving as a visual summary of the crew member's most salient data points [Previous Response]. The "ugliness" is intentional, making the avatar part of the meta-narrative of "terrible corporate-issued ship management software" [Previous Response, 160].

### **IV. Requirements**

#### **A. Functional Requirements**

1.  **Crew Member Representation:** The system must generate a unique avatar for every `crew_member` in the game based on their `id`.
2.  **Data-to-Visual Mapping:** Avatars must visually represent the following core `crew_member` data points:
    *   **`cultural_background` / `homeworld`**: Determines the avatar's core shape and foundational color palette [Previous Response, 8, 15].
    *   **`skills`**: Influences visual detail, complexity, or specific minor elements (e.g., higher `engineering` skill could make a specific module appear more robust) [Previous Response, 8].
    *   **`personality`**: Affects subtle variations in the avatar's core shape, line fluidity, or element orientation (e.g., `bravery` could make lines sharper) [Previous Response, 7].
    *   **`status`**: (`health`, `morale`, `fatigue`): Dynamically apply visual overlays or effects indicating current condition (e.g., color tint, "flickering," "broken" lines for low health/morale/high fatigue) [Previous Response, 8, 54]. These must update in real-time with `tick_update` broadcasts.
    *   **`traits`**: Integrate specific visual glyphs or "overlays" for each possessed `trait` [Previous Response, 82].
        *   `trait_level` (I, II, III) must influence the visual prominence or slight animation of the glyph [Previous Response, 75].
        *   `Corruption Risk` for Level III traits must introduce a subtle "glitch" or "asymmetry" element [Previous Response, 75].
    *   **`Time Debt`**: Crew members with significant `relativistic aging` or `Time Debt` should have specific visual elements (e.g., a faint, slow temporal "ripple" or non-linear age markings) [Previous Response, 7, 182, 186].
    *   **`memories`**: Highly significant or recurring `memories` could trigger rare, temporary, small "memory icon" overlays [Previous Response, 7, 37].
    *   **`hiring_history` / `family_lineage`**: Could subtly influence background texture or shared design motifs [Previous Response, 8, 15].
3.  **Progressive Revelation:** The visibility and detail of avatar elements must be tied to the player's acquired "meta-knowledge" traits [Previous Response, 79, 80]:
    *   **Trait-Blind Players**: See only base shape, cultural colors, and basic skill/personality influences. `trait_glyphs` are hidden [Previous Response, 79].
    *   **"Pays Attention To People" Trait**: Basic `trait_glyphs` become visible, but without specific mechanical info [Previous Response, 79].
    *   **"Good Judge Of Character" Trait**: Reveals trait levels (visual distinction between I, II, III) [Previous Response, 79].
    *   **"Knows The Business" Trait**: Enables full mechanical details (e.g., hover-over pop-ups for glyphs detailing stat bonuses/effects) [Previous Response, 79].
4.  **Meta-Narrative Integration:** The system should occasionally introduce rare "visual glitches" (e.g., temporary distortion, color inversion, `[MEMORY ERROR]` text overlay) to hint at the "simulation substrate" or `computer_personality_decay` [Previous Response, 97, 162].

#### **B. Technical Requirements**

1.  **Server-Side Generation:** All avatar SVG strings must be generated authoritative-ly on the Node.js server [Previous Response, 3, 144].
2.  **SVG Output:** The output for each avatar must be a single SVG string [Previous Response].
3.  **Data Models as Input:** The generator must directly consume data from the `crew_members` and `trait_definitions` database tables [Previous Response, 15, 83, 82].
4.  **Modular SVG Library:** The server must maintain a library of small, reusable SVG components (shapes, glyphs, overlays) that can be programmatically combined [Previous Response].
5.  **Client-Side Rendering:** The Vue.js client will receive the SVG string via WebSocket `tick_update` broadcasts and render it directly into the HTML (e.g., via `v-html`) [Previous Response, 3, 17].
6.  **Minimal Client-Side Logic:** Client-side JavaScript should primarily handle rendering and the display logic for "progressive revelation" (e.g., showing/hiding `trait_glyphs` based on player traits), not the generation itself [Previous Response, 3].
7.  **Scalability:** The system must be designed to generate avatars for a large number of concurrent crew members (thousands) efficiently.

#### **C. Performance Requirements**

1.  **Tick Integration:** Avatar generation must be fast enough to be included within the `tick_update` processing cycle (4-60 seconds, depending on server load) without causing significant delays [Previous Response, 4, 46, 144].
2.  **Lightweight Output:** Generated SVG strings must be as compact as possible to minimize WebSocket payload size and client-side rendering load [Previous Response, 20, 153].
3.  **Client Responsiveness:** Rendering and dynamic updates of avatars on the client must be smooth and not introduce UI lag [Previous Response, 20].

### **V. Ideas/Concepts (Design Details)**

#### **A. The "Lego" System: Data-Driven SVG Assembly**

The generation process will leverage the existing `Crew Member Schema` and `Trait Definitions` as direct inputs, programmatically combining pre-defined SVG "modules" [Previous Response]. These modules will be simple, abstract shapes and symbols, fitting the brutalist aesthetic [Previous Response].

**Proposed SVG Module Library Structure:**

```
/shared/svg_modules/
├── base_shapes/            // Core cultural/homeworld forms (e.g., corporate_unit.svg, agricultural_organic.svg)
├── core_elements/          // Abstract "eye", "mouth", "body" components (e.g., eye_sensor.svg, power_core.svg)
├── skill_indicators/       // Small, abstract symbols for skills (e.g., engineering_glyph.svg, piloting_glyph.svg)
├── trait_glyphs/           // Unique, simple symbols for each trait (e.g., handy_wrench.svg, handshake_icon.svg)
├── status_overlays/        // Transparent SVG layers for health, morale, fatigue (e.g., health_low_tint.svg)
├── time_debt_effects/      // Subtle distortions for relativistic aging (e.g., temporal_flicker.svg, age_markings.svg)
└── reputation_auras/       // Background glows/colors based on faction reputation (stretch goal)
```
[Previous Response]

#### **B. Intelligent, Refined, and Smarter Generation Process**

1.  **Cultural-First Base Generation**: The `CrewAvatarGenerator` (server-side) reads `cultural_background` from `crew_members` data [Previous Response, 8, 15]. This dictates the **base shape** from `base_shapes/` and an initial **color palette** (e.g., Corporate: blues/greys; Agricultural: greens/browns) [Previous Response, 98, 99].
2.  **Skill & Personality Refinement**: `skills` values (0-100) are mapped to subtle scaling or opacity changes in `core_elements/` or `skill_indicators/`. `personality` values influence the "attitude" of abstract forms [Previous Response, 7, 8].
3.  **Dynamic Trait Overlay**: For each `trait`, the corresponding `trait_glyph.svg` is layered onto the avatar [Previous Response, 82]. `trait_level` influences visual prominence (e.g., Level III traits might have a vibrant color or subtle pulse) [Previous Response, 75]. If a Level III trait has `corruption_risk`, a subtle "glitch" or "asymmetry" element from `status_overlays/` or `time_debt_effects/` is introduced [Previous Response, 75].
4.  **Real-Time Status & Emergent Effects**: `health`, `morale`, and `fatigue` dynamically apply `status_overlays/` (e.g., a transparent red overlay for low health) [Previous Response, 8]. These are updated during `tick_update` broadcasts. `Time Debt` can be shown as temporal "ripple" effects or non-linear age markings [Previous Response, 182]. Significant `memories` could trigger a rare, temporary "memory icon" [Previous Response, 7, 37].
5.  **Progressive Revelation as a Game Mechanic**: The information density of the avatar scales with the player's "meta-knowledge" traits [Previous Response, 79, 80]. As the player gains traits like `"Pays Attention To People"`, `"Good Judge Of Character"`, or `"Knows The Business"`, more detailed trait information (names, levels, mechanical effects) becomes visible on the avatar [Previous Response, 79]. This makes the avatar an evolving part of the UI, consistent with the brutalist philosophy where "new interface elements appear only when player gains relevant capabilities".
6.  **Meta-Narrative Integration & "Glitches"**: The abstract "ugliness" reinforces the "terrible corporate-issued ship management software" concept [Previous Response, 160]. Occasional, rare "visual glitches" (e.g., temporary distortion, `[MEMORY ERROR]` text overlay) can occur, hinting at the "simulation substrate" and "reality benders" lore, potentially tied to `computer_personality_decay` or intense `Time Debt` effects [Previous Response, 97, 162, 182].

### **VI. Acceptance Criteria**

#### **A. Functional Correctness**

*   All active `crew_members` display an avatar in the client UI.
*   Avatars accurately reflect the `cultural_background`, `skills`, `personality`, and `status` of the associated crew member.
*   All active `traits` (Level I, II, III) are visibly represented on the avatar through unique glyphs.
*   Level III traits with `corruption_risk` display a distinct visual cue.
*   Dynamic `status` changes (`health`, `morale`, `fatigue`) on crew members result in immediate and appropriate visual updates to their avatars.
*   The avatar's displayed information (e.g., trait glyphs, levels, mechanical effects) correctly adheres to the player's acquired "meta-knowledge" traits (`"Pays Attention To People"`, `"Good Judge Of Character"`, `"Knows The Business"`).
*   Crew members with `Time Debt` or significant `memories` display their respective visual cues.
*   Rare `[MEMORY ERROR]` or similar meta-narrative glitches appear occasionally and are correctly linked to underlying game state (e.g., `computer_personality_decay`, `Time Debt`).

#### **B. Aesthetic Alignment**

*   All generated avatars consistently embody the "brutalist HTML" aesthetic, appearing as unstyled, functional SVG compositions.
*   The abstract nature of the avatars is maintained, avoiding any elements that suggest photorealism or traditional character art [Previous Response].

#### **C. Performance & Reliability**

*   Avatar generation on the server does not cause the `tick_update` processing time to exceed its target intervals (4-60 seconds).
*   The client renders and updates all visible avatars smoothly, without noticeable lag or frame drops, even with a full ship crew.
*   Generated SVG strings are free of errors and render correctly in all supported browsers.
*   The `CrewAvatarGenerator` is resilient to missing or malformed `crew_member` or `trait_definition` data, gracefully handling errors or falling back to default representations.

#### **D. Scalability & Testability**

*   The system can generate unique avatars for at least 1,000 distinct crew members without performance degradation.
*   The mapping from `crew_member` data to specific SVG components and visual properties is clearly defined and testable.
*   The modular SVG library can be easily expanded with new components for future `traits`, `cultural_backgrounds`, or `status` effects.

---