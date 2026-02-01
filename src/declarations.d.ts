declare module 'plyr' {
    export default class Plyr {
        constructor(element: HTMLElement, options?: any);
        play(): void;
        pause(): void;
        togglePlay(): void;
        static setup(target: any, options?: any): Plyr[];
        
        currentTime: number;
        playing: boolean;
        elements: { 
            container: HTMLElement;
            original: HTMLElement;
            poster: HTMLElement;
            // Add other elements as needed
        };
        media: HTMLElement;
        provider: string;
        source: string;
        
        // Event listeners
        on(event: string, callback: (event: any) => void): void;
    }
}
