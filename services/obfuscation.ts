/**
 * UGS Nexus Security Service
 * Implements simplified obfuscation to protect the source origin 
 * without the overhead of complex rotation logic.
 */

class SecureLoader {
    private static instance: SecureLoader;
    // Base64 encoded: https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/
    private readonly ENCODED_ORIGIN = "aHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L2doL2J1YmJscy91Z3Mtc2luZ2xlZmlsZS8=";
    
    private constructor() {}

    public static getInstance(): SecureLoader {
        if (!SecureLoader.instance) {
            SecureLoader.instance = new SecureLoader();
        }
        return SecureLoader.instance;
    }

    /**
     * Decodes the base URL on demand.
     */
    private getBaseUrl(): string {
        try {
            return atob(this.ENCODED_ORIGIN);
        } catch (e) {
            console.error("Decryption fault");
            return "";
        }
    }

    /**
     * Assembles the full secure URL for a given resource.
     * @param filename The identifier of the file
     */
    public assembleResourceUrl(filename: string): string {
        const base = this.getBaseUrl();
        // Timestamp prevents caching of the game code and adds entropy
        const timestamp = Date.now(); 
        return `${base}${filename}.html?t=${timestamp}`;
    }

    /**
     * Fetches the content using the obfuscated URL.
     */
    public async fetchResource(filename: string): Promise<string> {
        const secureUrl = this.assembleResourceUrl(filename);
        try {
            const response = await fetch(secureUrl);
            if (!response.ok) throw new Error("Secure handshake failed");
            return await response.text();
        } catch (e) {
            console.error("Encryption layer error:", e);
            throw e;
        }
    }
}

export const securityService = SecureLoader.getInstance();