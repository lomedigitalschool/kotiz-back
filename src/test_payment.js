// src/test_payment.js
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import url from 'url'; // Importation nécessaire pour analyser l'URL de base

dotenv.config();

// ----------------------------------------------------
// 🔧 Chargement des variables d'environnement
// ----------------------------------------------------
const {
  SEMOA_API_URL,
  SEMOA_USERNAME,
  SEMOA_PASSWORD,
  SEMOA_CLIENT_ID,
  SEMOA_CLIENT_SECRET,
  // SEMOA_API_KEY est la clé secrète de l'API pour le hachage
  SEMOA_API_KEY, 
} = process.env;

// 🧩 Fonction pour générer la date au format AWS (nécessaire pour la signature HMAC Semoa)
function getAmzDate() {
  const now = new Date();
  // Format YYYYMMDDTHHMMSSZ (ex: 20250930T180924Z)
  return now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
}

// ----------------------------------------------------
// 🧩 Fonction principale
// ----------------------------------------------------
(async () => {
  console.log("----------------------------------------------------");
  console.log("🚀 Démarrage du test d'initialisation Semoa (Sandbox)");
  console.log("----------------------------------------------------");

  console.log("🌍 SEMOA_API_URL:", SEMOA_API_URL);
  console.log("👤 SEMOA_USERNAME:", SEMOA_USERNAME);
  console.log("🔑 SEMOA_API_KEY:", SEMOA_API_KEY ? "✅ définie" : "❌ manquante");

  try {
    const baseUrl = SEMOA_API_URL;
    const ref = `TEST-KOTIZ-${Date.now()}`;
    const endpointPath = '/api/v1/initiate'; // Chemin seul

    // Analyser l'URL de base pour obtenir le host (hôte)
    const baseUrlObject = url.parse(baseUrl);
    const host = baseUrlObject.host; 

    // ----------------------------------------------------
    // 1️⃣ Authentification pour obtenir le Bearer Token via /auth
    // ----------------------------------------------------
    console.log("🔑 Obtention du Bearer Token depuis /auth...");

    const authBody = {
      username: SEMOA_USERNAME,
      password: SEMOA_PASSWORD,
      client_id: SEMOA_CLIENT_ID,
      client_secret: SEMOA_CLIENT_SECRET,
    };

    const tokenResponse = await axios.post(`${baseUrl}/auth`, authBody, {
      headers: { "Content-Type": "application/json" },
    });

    const access_token = tokenResponse?.data?.access_token;
    if (!access_token) throw new Error("access_token manquant dans la réponse");

    console.log("✅ Token obtenu avec succès !");

    // ----------------------------------------------------
    // 2️⃣ Préparation de la requête d'initialisation
    // ----------------------------------------------------
    const endpointUrl = `${baseUrl}${endpointPath}`;
    const xAmzDate = getAmzDate();
    const contentType = "application/json";

    const paymentBody = {
      reference: ref,
      amount: 1000,
      currency: "XOF",
      customer: {
        phone: "22890000000",
        name: "John Doe",
      },
      description: "Test paiement Kotiz",
      callback_url: "https://webhook.site/test-kotiz",
    };
    
    // ----------------------------------------------------
    // 3️⃣ Génération de la signature HMAC-SHA256 
    // Nous allons construire la chaîne à signer complète pour plus de robustesse.
    // ----------------------------------------------------
    const payloadString = JSON.stringify(paymentBody);
    
    // 3.1 Création de l'empreinte du corps de la requête (hash du payload)
    const bodyHash = crypto.createHash('sha256').update(payloadString).digest('hex');

    // 3.2 Création de la chaîne canonique de la requête
    const canonicalRequest = [
      'POST',
      endpointPath,
      // Query string (vide)
      '', 
      // Headers signés (doivent être en minuscules et triés)
      `content-type:${contentType}\n`,
      `host:${host}\n`,
      `x-amz-date:${xAmzDate}\n`,
      // Liste des headers signés
      'content-type;host;x-amz-date',
      // Empreinte (hash) du corps de la requête
      bodyHash
    ].join('\n');
    
    console.log("[DEBUG] Chaîne canonique:", canonicalRequest.replace(/\n/g, '\\n'));


    // 3.3 Création de la chaîne à signer (String to Sign)
    // L'API Semoa semble utiliser une méthode simple (hachage du payload avec la clé)
    // MAIS, si elle utilise le format AWS, la chaîne à signer est différente.
    
    // Nous revenons à la méthode simple si l'API n'est PAS totalement AWS-compliant:
    // Hachage du corps de la requête UNIQUEMENT
    const simpleHash = crypto
      .createHmac("sha256", SEMOA_API_KEY)
      .update(payloadString)
      .digest("base64"); 

    // Construction du header Authorization complet
    // Format attendu: SEMOA-HMAC-SHA256 Credential=ID, SignedHeaders=..., Signature=...
    const signedHeaders = "content-type;host;x-amz-date";
    const authorizationHeader = `SEMOA-HMAC-SHA256 Credential=${SEMOA_CLIENT_ID}, SignedHeaders=${signedHeaders}, Signature=${simpleHash}`;

    console.log("🚀 Initialisation paiement vers", endpointUrl);
    console.log("[DEBUG] Host:", host);
    console.log("[DEBUG] Authorization (HMAC):", authorizationHeader);
    console.log("[DEBUG] X-Amz-Date:", xAmzDate);
    
    // ----------------------------------------------------
    // 4️⃣ Requête d'initialisation
    // ----------------------------------------------------
    const paymentResponse = await axios.post(endpointUrl, paymentBody, {
      headers: {
        // 🛑 Header Authorization basé sur HMAC-SHA256
        Authorization: authorizationHeader, 
        
        // Headers requis pour le HMAC (SignedHeaders)
        "Content-Type": contentType,
        "X-Amz-Date": xAmzDate, 
        
        // Le Bearer Token est potentiellement requis en plus de la signature HMAC
        // On l'envoie dans un header séparé pour ne pas interférer avec "Authorization"
        AuthorizationToken: `Bearer ${access_token}`, 
        
        // L'hôte est normalement géré par Axios, mais on le log
        // Host: host, 
        
        Accept: "application/json",
      },
    });

    console.log("✅ Paiement initialisé avec succès !");
    console.log("💡 Réponse API:", paymentResponse.data);

    console.log("\n--- RÉSULTAT DE L'API SEMOA ---");
    console.log("✅ SUCCÈS: Paiement initialisé !");
    console.log("   Détails:", paymentResponse.data);

  } catch (error) {
    console.error("❌ Erreur init paiement:", error.response?.data || error.message);
    console.log("\n--- RÉSULTAT DE L'API SEMOA ---");
    console.log("❌ ÉCHEC: Erreur d'initialisation du paiement.");
    console.log("   Erreur:", error.message || error);
    console.log("   Détails:", error.response?.data || "Aucun détail fourni");
    console.log(
      "\nNOTE: Si l'erreur persiste, assurez-vous que la variable SEMOA_API_KEY est la bonne clé SECRÈTE de signature HMAC fournie par Semoa."
    );
  }

  console.log("----------------------------------------------------");
})();
