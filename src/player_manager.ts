import { Notice } from "obsidian";
import Plyr from "plyr";
import { stringToHash } from "./utils";

/**
 * Finds all Plyr instances within the given element.
 */
function findAllPlayers(container: HTMLElement): Plyr[] {
    const playerElements = container.querySelectorAll('.plyr-player, .plyr');
    const players: Plyr[] = [];
    
    playerElements.forEach((el: any) => {
        if (el.plyr && !players.includes(el.plyr)) {
            players.push(el.plyr);
        }
    });

    // Also check for players attached to containers which might be parent elements
    const containers = container.querySelectorAll('.plyr--full-ui'); // Plyr adds this class to container
    containers.forEach((el: any) => {
        if (el.plyr && !players.includes(el.plyr)) {
            players.push(el.plyr);
        }
    });

    return players;
}

/**
 * Tries to find the "active" player to insert a timestamp for.
 * Hierarchy of choice:
 * 1. The currently playing video.
 * 2. If only one exists, that one.
 * 3. If multiple exist and none playing, the first one (with a warning).
 */
export function findActivePlayer(container: HTMLElement): Plyr | null {
    const players = findAllPlayers(container);

    // Choice 1: Currently playing
    const playing = players.find(p => p.playing);
    if (playing) return playing;

    // Choice 2: Single player
    if (players.length === 1) return players[0];

    // Choice 3: First one (fallback)
    if (players.length > 1) {
        new Notice("Multiple players found. Using the first one.");
        return players[0];
    }

    return null;
}

/**
 * Finds a specific player by its media ID.
 * Checks the original element, the container, and the media element for the ID.
 */
export function findPlayerById(container: HTMLElement, mediaId: string): Plyr | null {
    if (!mediaId) return null;
    
    const players = findAllPlayers(container);
    
    for (const player of players) {
        const checks = [
            (player as any).elements?.original,
            (player as any).elements?.container,
            player.media
        ];

        for (const el of checks) {
            if (el && el.getAttribute && el.getAttribute("data-media-id") === mediaId) {
                return player;
            }
        }
        
        // Fallback: Check derived hash for Youtube
        if (player.provider === 'youtube' && player.source) {
            const hash = stringToHash(player.source);
            if (hash === mediaId) return player;
        }
    }
    
    return null;
}
