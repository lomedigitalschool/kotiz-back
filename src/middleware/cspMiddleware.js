import crypto from 'crypto';

export const cspMiddleware = (req, res, next) => {
    // Générer un nonce unique pour chaque requête
    const nonce = crypto.randomBytes(16).toString('base64');
    
    // Stocker le nonce dans res.locals pour l'utiliser dans les vues
    res.locals.nonce = nonce;

    // Configurer CSP avec le nonce
    const cspHeader = {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                `'nonce-${nonce}'`, // Utiliser le nonce pour les scripts
                // Ajouter des hashes spécifiques si nécessaire
                "'sha256-iHAA4btJN+7QfoSRhqGbhYbEZqBuyesONp0wfyXWcqo='",
                "'sha256-QEvPYBVC4/elBmqZMNgsmK/t4fbYlYlKFHMNgtbQhug='",
                "'sha256-s3awwLVKIlkpRfkaaj52BR2uN8hCzlzb6MchVuAUdaM='"
            ],
            styleSrc: ["'self'", "'unsafe-inline'"], // Styles peuvent rester unsafe-inline pour le moment
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'", "data:", "https:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"]
        }
    };

    // Définir l'en-tête CSP
    res.setHeader(
        'Content-Security-Policy',
        Object.entries(cspHeader.directives)
            .map(([key, value]) => `${key} ${value.join(' ')}`)
            .join('; ')
    );

    next();
};