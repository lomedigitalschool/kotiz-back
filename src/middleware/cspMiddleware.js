import crypto from 'crypto';

export const cspMiddleware = (req, res, next) => {
    // Disable CSP completely for AdminJS routes
    if (req.path.startsWith('/admin')) {
        return next();
    }

    // Générer un nonce unique pour chaque requête
    const nonce = crypto.randomBytes(16).toString('base64');
    
    // Stocker le nonce dans res.locals pour l'utiliser dans les vues
    res.locals.nonce = nonce;

    // Configurer CSP avec des règles plus permissives
    const cspHeader = {
        directives: {
            "default-src": ["'self'"],
            "script-src": [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                `'nonce-${nonce}'`,
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com"
            ],
            "style-src": [
                "'self'", 
                "'unsafe-inline'", 
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com"
            ],
            "img-src": ["'self'", "data:", "https:", "blob:"],
            "connect-src": ["'self'", "ws:", "wss:"],
            "font-src": [
                "'self'", 
                "data:", 
                "https:", 
                "https://fonts.gstatic.com",
                "https://fonts.googleapis.com"
            ],
            "object-src": ["'none'"],
            "media-src": ["'self'"],
            "frame-src": ["'self'"]
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