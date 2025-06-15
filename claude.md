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

## Current Implementation Status (June 2025)

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
