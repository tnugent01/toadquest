# Game Story & NPC Mechanics: The Turquoise Toad's Ascent

## The Core Narrative
You play as a regular, naturalistic turquoise toad who has somehow been digitized into the Endless Spire—a towering physical manifestation of a corrupted hard drive. You aren't a hero, just a toad trying to get back to the physical swamp. Your only way out is to ascend the Spire and recover the **5 Sacred Scrolls of Syntax**, which possess the power to reboot the system and open a portal home.

However, the scrolls aren't simply sitting on platforms waiting to be picked up. They are hidden, locked, or protected by logic puzzles. To retrieve them, you must seek out the Spire's surviving inhabitants (NPCs).

## The NPCs and The Information Gathering Mechanic
Scattered throughout the vertical climb are NPCs (e.g., a glitchy fortune teller, a retired firewall guard, a lonely compiler), who are bewildered by the presence of a real, biological toad in their system.

**The Mechanic:**
1. The toad approaches an NPC and initiates dialogue (opening a text input box powered by the Gemini API).
2. The player must converse naturally with the NPC, perhaps leveraging the toad's unique biological perspective or just asking the right questions, to extract specific, critical information.
3. **Changing the Objective**: Getting this info changes the objective from "just reach the top" to executing a specific contextual action based on what the NPC reveals.

## The 5 Scrolls & Their Required NPC Interactions

### 1. The Scroll of Variables (The Invisible Platform)
- **The Obstacle**: The scroll is floating in mid-air, but the platform beneath it is invisible and lacks collision.
- **The NPC**: A paranoid archivist hiding in a corner.
- **The Information**: The player must convince the archivist they are a friend. Once trusted, the archivist reveals a specific phrase: "The path is built on trust."
- **The Changed Objective**: The player must walk to the empty air, open the chat terminal, and type "The path is built on trust" to solidify the invisible platforms and reach the scroll.

### 2. The Scroll of Logic (The Riddle Lock)
- **The Obstacle**: The scroll is trapped inside a glass cage with a combination lock.
- **The NPC**: A cryptic sphinx-like creature who loves games.
- **The Information**: The sphinx will only give the 4-digit combination if the player can answer a procedurally generated riddle (created via LLM).
- **The Changed Objective**: The player must solve the riddle through conversation. Once answered correctly, the sphinx gives the code natively in the dialogue. The player must then type that code into a terminal near the cage.

### 3. The Scroll of Functions (The Offering)
- **The Obstacle**: A giant stone guardian blocks the path to the scroll. It cannot be jumped over or destroyed.
- **The NPC**: A traveling merchant lower down the spire.
- **The Information**: The merchant complains about the stone guardian. By asking the right questions, the merchant reveals the guardian loves "Digital Flies."
- **The Changed Objective**: The player must use the text terminal to "spawn" or "create" a Digital Fly and drop it near the guardian. The guardian eats it and steps aside.

### 4. The Scroll of Loops (The Time Trial)
- **The Obstacle**: The scroll is visible, but the moment you get near it, it teleports to a different platform.
- **The NPC**: A frantic, exhausted runner NPC.
- **The Information**: The runner reveals that the teleportation matrix only deactivates if the player says the command `"Halt Execution"` while standing on a specific blue tile, *before* approaching the scroll.
- **The Changed Objective**: Platform to the blue tile, type the command to freeze the scroll in place, and then collect it.

### 5. The Scroll of Execution (The Final Password)
- **The Obstacle**: The final door at the top of the level.
- **The NPC**: Three different corrupted nodes scattered near the top.
- **The Information**: Each node holds one-third of the final master password. However, their personalities are difficult (one lies, one is angry, one is sad). The player must carefully talk to all three using the LLM interface to piece together the final string.
- **The Changed Objective**: The ultimate social engineering test. Gather the three fragments, ascend to the final door, and type the combined password to win the game.
