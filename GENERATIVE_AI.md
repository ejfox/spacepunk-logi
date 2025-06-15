Here are three GitHub issues boiling down your ideas for leveraging generative AI tools, framed to align with "Spacepunk"'s core design principles and brutalist aesthetic:

### GitHub Issue 1: Implement AI-Generated Emergency Broadcast Audio

*   **Title:** Feature: Integrate AI-Generated Emergency Broadcast Audio with Radio Effects
*   **Description:**
    "Spacepunk" operates on an "indirect command structure" where players are typically in their quarters, receiving filtered and delayed information. To enhance critical moments and leverage "ElevenLabs" (or similar cost-effective AI voice generation), we should implement rare, impactful audio alerts for severe in-game events. These broadcasts should originate from the "terrible corporate-issued ship management software" and be intentionally unpolished, synthesized, and processed with a "radio effect" to fit the "simulation substrate" and "brutalist" interface. This adds a unique sensory layer to emergencies without requiring full voice acting or breaking the game's visual aesthetic.
*   **Acceptance Criteria:**
    *   A lightweight `SoundManager.js` module is integrated to manage audio playback, addressing the "silent space" initial design note.
    *   API integration with a text-to-speech service (e.g., ElevenLabs) is established for on-demand generation or a small pool of pre-generated emergency voice lines.
    *   Audio post-processing (e.g., distortion, static, radio filter) is applied to generated voice lines to create an intentionally degraded, "corporate broadcast" feel.
    *   Specific, critical in-game events (e.g., `Hull Integrity < 10%`, `Crew Mutiny imminent`, `System Critical Failure`) trigger these infrequent broadcasts.
    *   Broadcasts are distinct from regular text updates, designed to be jarring and memorable.
    *   Implementation prioritizes minimal resource usage and API calls (infrequent generation).

### GitHub Issue 2: Integrate Core UI & System Sound Effects

*   **Title:** Feature: Add Functional, Brutalist UI & Ship System Sound Cues
*   **Description:**
    While "Spacepunk" maintains a "zero-CSS brutalist HTML interface", subtle, functional sound effects can enhance player feedback and immersion without compromising the aesthetic. Leveraging royalty-free sound libraries (like Splice samples or similar sources) for subtle clicks, hums, and utilitarian alerts will reinforce the "bureaucratic mundanity" and the tactile feel of interacting with clunky corporate software. These sounds should be minimal, non-intrusive, and serve primarily as auditory cues for system states or UI interactions.
*   **Acceptance Criteria:**
    *   A `SoundManager.js` is implemented to handle playback of short, functional sound effects.
    *   Key UI interactions (e.g., button clicks, tab switches, form submissions, data field updates) have subtle, generic audio feedback.
    *   Critical ship system status changes (e.g., `component degradation`, `market fluctuations`, `new mission available`, `fuel low`) have distinct, non-dramatic alert sounds.
    *   Sound assets are sourced from royalty-free or public domain libraries to manage costs.
    *   Audio cues are designed to be complementary to the text-based interface, providing information without being a primary focus.

### GitHub Issue 3: Implement AI-Generated Crew ID Photos with Progressive Revelation

*   **Title:** Feature: AI-Generated Crew ID Photos Tied to Backstory & Cost
*   **Description:**
    To deepen "crew relationships" and add a personalized touch within the "brutalist HTML interface", implement AI-generated "ID photos" for crew members. These images should be generated using free/cost-effective image AI tools and explicitly designed to look like "terrible corporate-issued ship management software" photos – low-fidelity, potentially pixelated, or slightly unsettling – reinforcing the game's thematic elements of "simulation substrate" and "resource scarcity". Critically, these photos are not for all crew immediately; they are a "progressively revealed" element. They should only be generatable *after* the player has built up significant backstory and relationship depth with a crew member (e.g., high loyalty, numerous shared "memories"), and potentially require an in-game credit cost to emphasize their infrequent and earned nature.
*   **Acceptance Criteria:**
    *   API integration with a free/cost-effective AI image generation service is established.
    *   A threshold is defined for a crew member's "backstory" or "relationship depth" (e.g., `crew_members.personality.loyalty` score, number of `crew_members.memories`) that must be met before their ID photo can be generated.
    *   An in-game cost (e.g., `players.credits`) is implemented for the player to "request" or "purchase" a crew member's ID photo from their profile.
    *   Generated images are stored in the `crew_members` table (e.g., in a `JSONB` column for `personal_data`) and loaded when viewing the crew member's detailed profile.
    *   The displayed images maintain the "brutalist aesthetic" (e.g., raw `<img>` tag without CSS styling, low resolution, potential visual glitches).
    *   The system ensures that photo generation is infrequent due to the costs and backstory requirements.