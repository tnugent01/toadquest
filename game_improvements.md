# Game Improvements Shortlist

Based on recent testing, here is the prioritized list of features and fixes needed to complete the core gameplay loop for "Quest for the Sacred Scrolls":

## 1. Infinite/Extended Vertical Platforms
- **Current Issue:** Platforms run out after a certain height, halting upward progression.
- **Solution:** Implement a procedural platform generation system or design much taller, complete levels so the player can continuously ascend to the top of the stage.

## 2. Dynamic NPC Dialogue & Logic
- **Current Issue:** The starting NPC ("Paranoid Archivist") currently does not respond to dialogue properly (likely due to the missing/placeholder Gemini API key or a connection error).
- **Solution:** 
  - Fix the API connection to ensure the NPC responds.
  - **Personality Update:** The NPC must be stubborn and not give up the answer/item easily. The player must provide a specific, thought-provoking answer to convince him.
  - **Reward:** Once convinced, the NPC will gladly hand over a **Key**.

## 3. The Key & The Glass Case (Objective Mechanics)
- **Current Issue:** No actual win condition or objective at the top of the level.
- **Solution:**
  - The **Key** obtained from the NPC is required to unlock a **Glass Case**.
  - The Glass Case is located at the very top of the level.
  - Inside the Glass Case is the **Sacred Scroll**.

## 4. Level Progression & Portals
- **Current Issue:** The game is currently a single endless sandbox.
- **Solution:**
  - Upon collecting the Sacred Scroll, a **Portal** spawns.
  - Entering the portal transports the Toad to the next level.
  - The game will feature **5 distinct levels** in total to complete the campaign.

## 5. Power-ups: "Soda Sprite"
- **Current Issue:** Movement is static; no power-ups exist.
- **Solution:**
  - Add collectible items, specifically a **"Soda Sprite"**.
  - **Effect:** Grabbing the soda grants the Toad 2x jump height and enables a **Double Jump** ability (effectively 2x jumping prowess) to reach otherwise inaccessible platforms.
