import dotenv from "dotenv";
import { postProcessGeneratedSite, getGripLogoUrl } from "./sitePostProcessor.js";
import { uploadImageUrlToCloudinary } from "./cloudinary.js";

dotenv.config();

/**
 * Smart Parser for AI Responses (Handles Markers + Markdown Fallback)
 */
function extractHTMLCSS(text, lead) {
    let htmlMatch = text.match(/===\s*HTML\s*===([\s\S]*?)===\s*CSS\s*===/i);
    let cssMatch = text.match(/===\s*CSS\s*===([\s\S]*)/i);

    let html = htmlMatch ? htmlMatch[1].trim() : null;
    let css = cssMatch ? cssMatch[1].trim() : null;

    if (!html || !css) {
        const htmlBlock = text.match(/```html\s*([\s\S]*?)```/i);
        const cssBlock = text.match(/```css\s*([\s\S]*?)```/i);

        if (htmlBlock) html = htmlBlock[1].trim();
        if (cssBlock) css = cssBlock[1].trim();

        if (htmlBlock && !cssBlock) css = "";
    }

    if (!html) {
        console.error("🔥 PARSING FATAL ERROR. Here is what the AI actually wrote:\n");
        console.error("--------------------------------------------------");
        console.error(text);
        console.error("--------------------------------------------------");
        console.warn("⚠️ AI returned invalid format. Retrying fallback template...");

        return {
            html: `<div style="padding:40px;font-family:Inter">
        <h1>${lead.name}</h1>
        <p>Professional website coming soon.</p>
        <a href="tel:${lead.phone}">Call Now</a>
      </div>`,
            css: ""
        };
    }

    return { html, css: css || "" };
}

/**
 * Get image from Pexels → Pixabay → Pollinations fallback
 */
let lastPollinationCall = 0;

async function getImage(query) {
    try {
        let imageUrl = '';
        if (process.env.PEXELS_API_KEY) {
            const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
                headers: { Authorization: process.env.PEXELS_API_KEY }
            });
            const data = await res.json();
            if (data?.photos?.[0]?.src?.large) imageUrl = data.photos[0].src.large;
        }

        if (!imageUrl && process.env.PIXABAY_API_KEY) {
            const res = await fetch(`https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3`);
            const data = await res.json();
            if (data?.hits?.[0]?.largeImageURL) imageUrl = data.hits[0].largeImageURL;
        }

        if (!imageUrl) {
            const now = Date.now();
            if (now - lastPollinationCall < 1000) {
                imageUrl = `https://via.placeholder.com/800x600?text=${encodeURIComponent(query)}`;
            } else {
                lastPollinationCall = now;
                imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(query)}?width=800&height=600&nologo=true`;
            }
        }

        // Upload the fetched image URL to Cloudinary so we get a persistent asset URL
        if (imageUrl && !imageUrl.startsWith('https://via.placeholder.com')) {
            const cloudinaryUrl = await uploadImageUrlToCloudinary(imageUrl);
            if (cloudinaryUrl) return cloudinaryUrl;
        }

        return imageUrl;

    } catch (err) {
        console.error('[getImage Error]:', err.message);
        return `https://via.placeholder.com/800x600?text=${encodeURIComponent(query)}`;
    }
}

/**
 * Generates a unique, high-converting website using Gemini.
 */
export async function generateSiteCode(
    website,
    instructions = "Make it modern, premium, high-converting."
) {
    try {
        if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured.");

        // Map website model to standard lead structure expected by prompt
        const lead = {
            name: website.companyName,
            category: website.category,
            phone: website.phoneNumber,
            address: website.location,
            description: website.description,
            email: website.email,
            websiteUrl: website.website,
            repName: website.name,
            logo: website.logo || ""
        };

        const catLower = lead.category.toLowerCase();
        let serviceKeywords = [];
        let aboutImageKeyword = "";
        
        if (catLower.includes("tourism") || catLower.includes("travel")) {
            aboutImageKeyword = "travel landmarks collage landscape professional";
            serviceKeywords = [
                "tour packages travel vacation",
                "airport transfer taxi bus",
                "flight booking hotel room",
                "itinerary travel map planning",
                "family holiday honeymoon beach",
                "temple pilgrim spiritual",
                "mice conference meeting event",
                "visa passport document travel"
            ];
        } else {
            aboutImageKeyword = "business team workspace office professional";
            serviceKeywords = [
                "primary service main",
                "premium quality care",
                "consulting expert advising",
                "advanced modern technology",
                "customer client support care",
                "custom planning solution",
                "team collaboration workspace",
                "satisfaction guarantee quality"
            ];
        }

        const aboutImage = await getImage(`${lead.category} ${aboutImageKeyword}`);
        
        // Fetch 8 dynamic images for the service cards based on category
        const serviceImages = [];
        for (const kw of serviceKeywords) {
            const img = await getImage(`${lead.category} ${kw}`);
            serviceImages.push(img);
        }

        const companySlug = lead.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const defaultGripUrl = `https://gripforum.com/aram/${companySlug}`;
        const finalWebUrl = lead.websiteUrl || defaultGripUrl;
        const gripLogoUrl = getGripLogoUrl();

        // ✅ FORMAT PHONE FOR WHATSAPP (ENSURE 91 PREFIX FOR INDIA)
        let whatsappPhone = lead.phone.replace(/\D/g, "");
        if (whatsappPhone.startsWith("0") && whatsappPhone.length === 11) whatsappPhone = whatsappPhone.substring(1);
        if (whatsappPhone.length === 10) whatsappPhone = "91" + whatsappPhone;

        let taglinePrompt = "";
        let checklistPrompt = "";
        let servicesPrompt = "";
        let whyUsPrompt = "";

        if (catLower.includes("tourism") || catLower.includes("travel")) {
            taglinePrompt = `"${lead.name.substring(0, 3).toUpperCase()} TOURISM PROVIDE ONE STOP SOLUTION FOR YOUR TRAVEL NEEDS"`;
            checklistPrompt = `
       * Customized Tour Packages
       * Domestic & International Travel Planning
       * Hotel, Flight & Transport Arrangements
       * Experienced Tour Organizers & 24/7 Support
       * One-stop Travel & Holiday Solution
            `;
            servicesPrompt = `
     1. Domestic & International Tour Packages (Image: ${serviceImages[0]}) - Description: "Customized holiday packages across the globe."
     2. Airport Transfers & Local Transportation (Image: ${serviceImages[1]}) - Description: "Reliable pick-up and drop services for travelers."
     3. Flight & Hotel Bookings (Image: ${serviceImages[2]}) - Description: "Best deals on flights, hotels & cab services."
     4. Customized Itineraries (Image: ${serviceImages[3]}) - Description: "Tailor-made travel plans based on preferences."
     5. Family Holidays & Honeymoon Trips (Image: ${serviceImages[4]}) - Description: "Memorable tours for families, couples & groups."
     6. Pilgrim & Temple Tours (Image: ${serviceImages[5]}) - Description: "Spiritual journeys to holy destinations."
     7. MICE Trips (Image: ${serviceImages[6]}) - Description: "Meetings, Incentives, Conferences and Exhibitions."
     8. Visa & Passport Assistance (Image: ${serviceImages[7]}) - Description: "End-to-end documentation and approval support."
            `;
            whyUsPrompt = `
        1. Trusted Travel Partner (Icon: fa-solid fa-handshake)
        2. Wide Destination Coverage (Icon: fa-solid fa-earth-americas)
        3. Customized Itineraries (Icon: fa-solid fa-user-check)
        4. 24/7 Support (Icon: fa-solid fa-headset)
            `;
        } else {
            taglinePrompt = `"${lead.name.substring(0, 3).toUpperCase()} ${lead.category.substring(0, 10).toUpperCase()} PROVIDE ONE STOP SOLUTION FOR YOUR ${lead.category.toUpperCase()} NEEDS"`;
            checklistPrompt = `
       * 5 distinct value proposition bullet points representing the high-quality services and trusted standards of ${lead.name} for the ${lead.category} industry.
            `;
            servicesPrompt = `
     1. Primary Category Service (Image: ${serviceImages[0]}) - Description: "Expert main service tailored to your requirements."
     2. Specialized Consulting & Support (Image: ${serviceImages[1]}) - Description: "Guidance and strategy to ensure premium outcomes."
     3. Custom Solution Delivery (Image: ${serviceImages[2]}) - Description: "Tailored implementations built for your unique profile."
     4. Advanced Care / Quality Feature (Image: ${serviceImages[3]}) - Description: "State-of-the-art modern tools and processes."
     5. Integrated Management Services (Image: ${serviceImages[4]}) - Description: "Seamless workflows and operations management."
     6. Premium Customer Support (Image: ${serviceImages[5]}) - Description: "Continuous support and training whenever needed."
     7. Professional Planning & Advisory (Image: ${serviceImages[6]}) - Description: "Strategic plans designed to match target goals."
     8. End-to-End Assistance & Quality Assurance (Image: ${serviceImages[7]}) - Description: "Comprehensive documentation and approval standard."
            `;
            whyUsPrompt = `
        1. Trusted Category Partner (Icon: fa-solid fa-handshake)
        2. Wide Domain Coverage (Icon: fa-solid fa-earth-americas)
        3. Customized Solutions (Icon: fa-solid fa-user-check)
        4. 24/7 Dedicated Support (Icon: fa-solid fa-headset)
            `;
        }

        const prompt = `
You are a Senior Creative Front-end Developer. Build a professional, clean, and modern landing page for "${lead.name}".
The design must strictly match the structure, styling, alignment, and design tokens specified below.

STRICT FORMAT:
Return output in this EXACT format:

===HTML===
[HTML HERE]

===CSS===
[CSS HERE]

No markdown formatting outside the markers. No explanations.
The very first line of your HTML MUST be: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
CRITICAL: Write the complete HTML and the complete CSS. Do not use placeholders or truncate content.
CRITICAL: Use ONLY flexbox and CSS grid for layouts. NEVER use HTML <table> for page layout or forms.
CRITICAL: Every form field MUST be wrapped: <div class="form-field"><label>...</label><input ...></div>
CRITICAL: Contact footer cards MUST be inside <div class="contact-cards"> with each card having class="contact-card".
CRITICAL: Include box-sizing: border-box on all elements. All images must have max-width: 100%.

========================
DESIGN SYSTEM & VARIABLES
========================
- Primary Color: #E63946 (Red) - Use for red headers, bullet dots, checkmarks, circle borders around icons, and links.
- Secondary Color/Light BG: #F5F5F5 (Light Gray) - Use for the footer/contact info section background.
- Background: #FFFFFF (White) - Default section background.
- Text Primary: #212529 - Main headings and dark text.
- Text Secondary: #6C757D - Taglines, labels, and muted text.
- Border Color: #E5E7EB - Cards and input borders.
- Heading Font: Poppins (import from Google Fonts)
- Body Font: Inter (import from Google Fonts)

========================
PAGE STRUCTURE (IN ORDER)
========================

1. BRANDING HEADER BLOCK (id="header"):
   - White background, padded wrapper (padding: 40px 80px).
   - Desktop Layout: A flex container with three main columns:
     - LEFT: GRIP badge image. Use EXACTLY: <img src="${gripLogoUrl}" alt="GRIP Proud Associate" class="grip-badge" style="width: 100px; height: 100px; object-fit: contain;">
     - CENTER:
        - Top: Circular company logo image or placeholder badge. Do NOT use suitcase, airplane, briefcase, or generic icon classes. Instead, use EXACTLY this logic:
          If a logo is provided ("${lead.logo}"), render it using EXACTLY: <img src="${lead.logo}" alt="${lead.name} Logo" class="company-logo" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #E63946;">
          If no logo is provided ("${lead.logo}" is empty), render a red circular wrapper (width: 80px, height: 80px, border-radius: 50%, background: #E63946, display: flex, align-items: center, justify-content: center, font-size: 32px, font-weight: bold, color: white) containing the first character of the company name: "${lead.name.substring(0,1).toUpperCase()}", with class "company-logo-placeholder".
        - Main Title (H1): "${lead.name}" (Poppins, bold, 36px, color #212529).
        - Subtitle Tagline (H2): ${taglinePrompt} (all caps, color #6C757D, letter-spacing 1px, font-size: 15px).
        - Contact info line: "Mobile: ${lead.phone} | Email: <a href="mailto:${lead.email}" style="color: #E63946; text-decoration: none; font-weight: bold;">${lead.email}</a>"
     - RIGHT: Matching GRIP badge image on the right. Use EXACTLY: <img src="${gripLogoUrl}" alt="GRIP Proud Associate" class="grip-badge" style="width: 100px; height: 100px; object-fit: contain;">
   - Mobile Layout: Stacked vertically, centered, elements aligned cleanly.

2. ABOUT US SECTION (id="about"):
   - White background, padding: 80px 0.
   - 50/50 two-column grid layout (desktop), 1 column on mobile.
   - LEFT: Collage/landmark image showing landmarks (rounded corners 16px). Use EXACTLY: <img src="${aboutImage}" alt="Collage" style="width:100%; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.05); object-fit: cover;">
   - RIGHT:
     - Heading: "About Us" (color: #E63946, Poppins bold, 36px, margin-bottom: 20px).
     - Body text: 2 paragraphs detailing the business and premium services for ${lead.category}.
     - Checklist: A vertical list of 5 items with a red checkmark icon (fa-check in #E63946):
${checklistPrompt}

3. OUR SERVICES SECTION (id="services"):
   - Padded section (padding: 80px 0), background: #FFFFFF.
   - Header: Centered label "• Our Services" (capitalized, with a red circle bullet on the left, font-size: 16px, color: #E63946, font-weight: 600, letter-spacing: 2px, background: #FFF5F5, padding: 6px 16px, border-radius: 20px, border: 1px solid #FFD8D8, display: inline-flex, align-items: center, gap: 8px).
   - Grid: 4-column grid (desktop), 2-column (tablet), 1-column (mobile). Gap: 30px.
   - Exactly 8 cards representing the services:
${servicesPrompt}
   - Card Design: White background, border-radius: 16px, box-shadow: 0 10px 30px rgba(0,0,0,0.04), overflow: hidden, hover: transform translateY(-5px) transition 0.3s ease.
   - Each card MUST have the image at the top (height: 200px, width: 100%, object-fit: cover), followed by service title (bold, left-aligned, Poppins, padding: 20px 20px 5px 20px), and description (left-aligned, Inter, color #6C757D, padding: 0 20px 20px 20px). No buttons inside cards.

4. WHY CHOOSE US SECTION (id="why-us"):
   - Padded section (padding: 80px 0), background: #FFFFFF, text-align: center.
   - Header: Centered pill label "• WHY CHOOSE US" (uppercase, red bullet, same pill badge style as Services). MUST be horizontally centered.
   - Grid: class="why-us-grid" with exactly 4 equal columns on desktop (display:grid; grid-template-columns: repeat(4, 1fr); gap: 20px; max-width: 1100px; margin: 0 auto). On mobile: 1 column.
   - Exactly 4 cards with class="why-us-card":
     - White background, border-radius: 16px, border: 1px solid #E5E7EB, padding: 32px 20px, text-align: center.
     - Card items:
${whyUsPrompt}
   - CRITICAL ICON RULES (do not break):
     - EVERY card MUST start with: <div class="icon-wrapper"><i class="fa-solid fa-..."></i></div>
     - Use ONLY FontAwesome icons (fa-handshake, fa-earth-americas, fa-sliders, fa-headset). NEVER use <img>, company logo, company name text, or placeholders as icons.
     - icon-wrapper MUST be a fixed 70x70 circle (border: 2px solid #E63946; border-radius: 50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 20px).
     - Icon color #E63946, font-size 28px. Never stretch icons.
     - Title: Bold Poppins 20px, centered. Description: Inter, #6C757D, centered.

5. LET'S CONNECT CONTACT FORM SECTION (id="connect-form"):
   - Padded section (padding: 80px 0), background: #FFFFFF.
   - Heading: Centered "Let's Connect" (where "Connect" is in primary color #E63946, Poppins bold, 36px).
   - Subtitle: Centered text "Your Reliable Partner for ${lead.category} — Call Us Today!" (Inter, color #6C757D, font-size: 16px, margin-bottom: 40px).
   - Form Container: Padded card (max-width: 700px, margin: auto, background #FFFFFF, border: 1px solid #E5E7EB, border-radius: 16px, padding: 40px, box-shadow: 0 10px 30px rgba(0,0,0,0.02)). Use <form class="contact-form"> with each field in a <div class="form-field"> wrapper: label on top, input/textarea below (block layout, NOT table, NOT side-by-side labels).
   - Fields (each with a label above in bold 14px Poppins #212529):
     - Name (Input text, required, placeholder: "Name", width 100%, border: 1px solid #E5E7EB, border-radius: 8px, padding: 12px)
     - Email (Input email, required, placeholder: "Email", width 100%, border: 1px solid #E5E7EB, border-radius: 8px, padding: 12px)
     - Phone (Input tel, required, placeholder: "Phone", width 100%, border: 1px solid #E5E7EB, border-radius: 8px, padding: 12px)
     - Message (Textarea, required, placeholder: "Message", width 100%, height: 150px, border: 1px solid #E5E7EB, border-radius: 8px, padding: 12px)
     - Captcha Row: Wrap in <div class="captcha-row"> flex container containing:
         - A read-only captcha box showing two random numbers like "X + Y = ?" (e.g. width 120px, text-align center, background #F3F4F6, border-radius: 8px 0 0 8px, display flex, items center, justify center, font-weight bold, border: 1px solid #E5E7EB)
         - An input field to type the answer (placeholder: "Your answer", flex grow, border: 1px solid #E5E7EB, padding: 12px)
         - A "Refresh" button (button, type="button", background #FFFFFF, border: 1px solid #E5E7EB, border-radius: 0 8px 8px 0, padding: 12px 20px, cursor pointer, on hover background #F9FAFB)
     - Send Button: A wide button (width 100%, background: #E63946 (or primary color), color white, border-radius: 8px, padding: 14px, font-size: 16px Poppins bold, cursor pointer, on hover background #C1121F).
   - Map block (CRITICAL - show below the form container): A container with margin-top: 50px, max-width: 700px containing a Google Maps iframe: <div class="map-container" style="margin-top: 50px; max-width: 700px; margin-left: auto; margin-right: auto;"><iframe src="https://maps.google.com/maps?q=${encodeURIComponent(lead.address)}&t=&z=13&ie=UTF8&iwloc=&output=embed" width="100%" height="450" style="border:0; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
   - Javascript: Include clean inline script to:
     - Generate random X and Y (1-9) on load, store the correct sum in a variable, and write the math problem inside the captcha box.
     - Add click listener to Refresh button to regenerate the math problem.
     - Add submit listener to the form:
       - Check if captcha input equals the correct sum. If not, show an alert "Incorrect captcha. Please try again." and prevent submission.
       - If correct, make a fetch POST request to "/api/websites/${website._id}/contact" sending JSON containing name, email, phone, and message.
       - Display a clean success alert on successful post, reset form fields, and regenerate the captcha.

6. CONTACT INFO CARDS & FOOTER (id="contact"):
   - Background color: #F5F5F5 (Light Gray) spanning full width. Padding: 60px 0 20px 0.
   - Wrap all 4 cards inside <div class="contact-cards"> grid container.
   - Grid: 4 columns (desktop), 2-col (tablet), 1-col (mobile). Gap: 20px. max-width 1100px centered.
   - Cards (class="contact-card", each white background, border-radius: 16px, padding: 30px, text-align: center, box-shadow: 0 4px 12px rgba(0,0,0,0.02)):
     - Card 1: Representative Name & Location. Icon: fa-user (red, font-size: 24px, margin-bottom: 15px). Top line: "${lead.name} Pvt Ltd" or "${lead.name}" (bold). Bottom line: "${lead.address || "Chennai, Tamil Nadu"}".
     - Card 2: Phone info. Icon: fa-phone-alt (red, 24px). Top line: "${lead.phone}" (bold). Bottom line: "Call Us".
     - Card 3: Email info. Icon: fa-envelope (red, 24px). Top line: "${lead.email || "info@gbtourism.in"}" (bold). Bottom line: "Drop a Mail".
     - Card 4: Web URL. Icon: fa-globe (red, 24px). Top line: "${finalWebUrl}" (bold, word-break: break-all). Bottom line: "Visit Website".
   - Footer copyright centered text at the bottom, below a thin horizontal separator line:
     "© 2025 GRIP | <a href="https://gripforum.com" style="color: #E63946; text-decoration: none;">gripforum.com</a>"

========================
CSS REQUIREMENTS
========================
- Import fonts: @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
- Reset: * { margin: 0; padding: 0; box-sizing: border-box; }
- body { font-family: 'Inter', sans-serif; color: #212529; background: #FFFFFF; line-height: 1.6; }
- Heading styling: font-family: 'Poppins', sans-serif;
- Responsiveness: Make sure all layouts wrap cleanly on mobile. Set proper padding (e.g. 20px on mobile).

BUSINESS DATA:
Name: ${lead.name} | Category: ${lead.category} | Phone: ${lead.phone} | Address: ${lead.address}
Description: ${lead.description}
Extra Instructions: ${instructions}
`;
        const models = [
            "gemini-2.5-pro",
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite"
        ];
        let rawText = "";
        let modelUsed = "";
        let lastQuotaError = null;

        for (const model of models) {
            for (let attempt = 1; attempt <= 4; attempt++) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

                    const response = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 8192
                            }
                        })
                    });

                    const data = await response.json();

                    if (!data?.candidates || data.candidates.length === 0) {
                        // Detect quota exhaustion (HTTP 429 / RESOURCE_EXHAUSTED)
                        const errorCode = data?.error?.code;
                        const errorStatus = data?.error?.status;
                        if (errorCode === 429 || errorStatus === 'RESOURCE_EXHAUSTED') {
                            const retryDelay = data?.error?.details?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay || 'shortly';
                            lastQuotaError = `Gemini API key has exhausted its daily quota (Free Tier limit reached for model: ${model}). Please update GEMINI_API_KEY in the .env file or retry in ${retryDelay}.`;
                            console.warn(`🚫 Quota exhausted for ${model}. Retry in ${retryDelay}.`);
                        } else {
                            console.warn(`⚠️ ${model} returned empty candidates. Raw response:`, JSON.stringify(data));
                        }
                        continue;
                    }

                    const candidate = data.candidates[0];
                    const finishReason = candidate?.finishReason;
                    const generatedText = candidate?.content?.parts?.[0]?.text?.trim();

                    if (!generatedText) {
                        console.warn(`⚠️ ${model} returned empty text`);
                        continue;
                    }

                    if (finishReason === "SAFETY") {
                        console.warn(`⚠️ Attempt ${attempt} with ${model} blocked by safety`);
                        continue;
                    }

                    const hasHTML = generatedText.includes("===HTML===") || generatedText.toLowerCase().includes("```html");
                    const hasCSS = generatedText.includes("===CSS===") || generatedText.toLowerCase().includes("```css");
                    const isLongEnough = generatedText.length > 4000;

                    const isValid =
                        generatedText &&
                        generatedText.length > 4000 &&
                        (generatedText.includes("===HTML===") || generatedText.includes("```html")) &&
                        (generatedText.includes("===CSS===") || generatedText.includes("```css"));

                    if (isValid) {
                        rawText = generatedText;
                        modelUsed = model;
                        break;
                    } else {
                        console.warn(`⚠️ Attempt ${attempt} failed validation | Model: ${model} | Length: ${generatedText.length}`);
                    }

                } catch (err) {
                    console.warn(`⚠️ Network error ${model}: ${err.message}`);
                }
            }

            if (rawText) break;
        }

        if (!rawText) {
            // Surface the most meaningful error to the caller
            if (lastQuotaError) {
                throw new Error(lastQuotaError);
            }
            throw new Error("AI website generation failed: the model could not produce valid HTML/CSS output. Please try again.");
        }

        console.log("RAW AI RESPONSE LENGTH:", rawText.length);

        const parsed = extractHTMLCSS(rawText, lead);

        let cleanHTML = parsed.html;
        if (cleanHTML.toLowerCase().includes("<body")) {
            cleanHTML = cleanHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || cleanHTML;
        }

        const processed = postProcessGeneratedSite(cleanHTML, parsed.css, website);

        return {
            html: processed.html,
            css: processed.css,
            modelUsed
        };
    } catch (err) {
        console.error("🔥 ERROR in generateSiteCode:", err.message);
        throw err;
    }
}

/**
 * AI Helper to generate business description and exactly 6 core services based on profile inputs
 */
export async function generateAiHelperProfile(companyName, category, location) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured.");

            const prompt = `
You are an expert business copywriter. Based on the following business profile:
Company Name: ${companyName}
Business Category: ${category}
Location/Head Office: ${location}

Generate:
1. A detailed description (exactly 2 paragraphs, around 100-120 words total) outlining the company's values, professionalism, and client approach. This description must match a premium corporate persona.
2. A list of exactly 6 core services (concise titles, each 2-4 words maximum) that this business specializes in, tailored to the category "${category}".

Respond with a JSON object. Return ONLY raw JSON, with no markdown tags or blocks. Structure:
{
  "description": "...",
  "services": ["Service 1", "Service 2", "Service 3", "Service 4", "Service 5", "Service 6"]
}
`;

            const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
            let rawText = "";

            for (const model of models) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
                    const response = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.7,
                                responseMimeType: "application/json"
                            }
                        })
                    });

                    const data = await response.json();

                    // Detect quota exhaustion
                    if (!data?.candidates || data.candidates.length === 0) {
                        const errorCode = data?.error?.code;
                        const errorStatus = data?.error?.status;
                        if (errorCode === 429 || errorStatus === 'RESOURCE_EXHAUSTED') {
                            const retryDelay = data?.error?.details?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay || 'shortly';
                            throw new Error(`Gemini API key has exhausted its daily quota. Please update GEMINI_API_KEY in the .env file or retry in ${retryDelay}.`);
                        }
                        console.warn(`[AI Helper] ${model} returned no candidates.`);
                        continue;
                    }

                    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                        rawText = data.candidates[0].content.parts[0].text;
                        break;
                    }
                } catch (err) {
                    console.warn(`[AI Helper Attempt ${model} failed]:`, err.message);
                    if (err.message?.includes('exhausted its daily quota')) throw err; // propagate quota errors immediately
                }
            }

            if (!rawText) {
                throw new Error('AI Helper returned an empty response. Please try again in a few seconds.');
            }

            const parsed = JSON.parse(rawText.trim());
            const desc = parsed.description || "";
            const srvs = Array.isArray(parsed.services) ? parsed.services.slice(0, 6) : [];

            if (desc.trim() && srvs.length === 6 && srvs.every(s => typeof s === 'string' && s.trim())) {
                console.log(`✅ [AI Helper Attempt ${attempt}] Successfully generated complete profile.`);
                return {
                    description: desc,
                    services: srvs
                };
            }
            console.warn(`⚠️ [AI Helper Attempt ${attempt}] Incomplete generation (services count: ${srvs.length}). Retrying...`);
        } catch (err) {
            console.error(`❌ [AI Helper Attempt ${attempt} Error]:`, err.message);
        }
    }

    // Fallback if all attempts fail
    console.warn("⚠️ All AI Helper attempts failed. Falling back to template generation.");
    return {
        description: `Established in ${location}, ${companyName} is a premier provider of high-quality ${category} solutions. We are dedicated to delivering reliable, customer-centric services tailored to the unique requirements of our clients.`,
        services: [
            "Primary Consultation",
            "Custom Solution Design",
            "Premium Support & Management",
            "Advanced Diagnostics",
            "End-to-End Implementation",
            "Quality Assurance Check"
        ]
    };
}
