const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
  try {
    // Load API keys from environment
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    // Get query from URL parameters
    const query = event.queryStringParameters?.q || 'luxury yacht';
    
    if (!query.trim()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html' },
        body: '<html><body><h1>Error: No query provided</h1></body></html>'
      };
    }

    // Call Perplexity API for AVA's summary
    const avaResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{
          role: 'user',
          content: `You are AVA, the sophisticated concierge for Opulent Shipyard Monaco. Write a brief, elegant introduction (2-3 sentences) about "${query}" in the context of luxury yachting and Monaco's maritime excellence. Be welcoming and knowledgeable.`
        }],
        max_tokens: 150
      })
    });

    const avaData = await avaResponse.json();
    const avaSummary = avaData.choices?.[0]?.message?.content || `Welcome to your search for "${query}". Let me guide you through the finest selections available.`;

    // Call Google Programmable Search API for images
    const googleResponse = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=5`
    );

    const googleData = await googleResponse.json();
    const imageResults = googleData.items || [];

    // Create slugified filename
    const slug = query.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Build HTML page
    const pageTitle = `${query} | Opulent Shipyard Monaco`;
    const metaDescription = avaSummary.replace(/"/g, '&quot;');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <meta name="description" content="${metaDescription}">
    
    <!-- Open Graph tags -->
    <meta property="og:title" content="${pageTitle}">
    <meta property="og:description" content="${metaDescription}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://opulent.trendible.news/searches/${slug}.html">
    <meta property="og:site_name" content="Opulent Shipyard Monaco">
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${pageTitle}">
    <meta name="twitter:description" content="${metaDescription}">
    
    <!-- JSON-LD structured data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${pageTitle}",
      "description": "${metaDescription}",
      "url": "https://opulent.trendible.news/searches/${slug}.html",
      "isPartOf": {
        "@type": "WebSite",
        "name": "Opulent Shipyard Monaco",
        "url": "https://opulent.trendible.news"
      }
    }
    </script>
    
    <style>
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f8f8;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .ava-summary {
            font-size: 1.2em;
            color: #333;
            font-style: italic;
            margin: 20px 0;
        }
        .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .result-card {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, opacity 0.5s ease;
            opacity: 0;
            transform: translateY(20px);
        }
        .result-card.fade-in {
            opacity: 1;
            transform: translateY(0);
        }
        .result-card:hover {
            transform: translateY(-5px);
        }
        .result-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        .result-content {
            padding: 20px;
        }
        .result-title {
            font-size: 1.1em;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        .result-link {
            color: #3498db;
            text-decoration: none;
            font-size: 0.9em;
        }
        .result-link:hover {
            text-decoration: underline;
        }
        .back-link {
            display: inline-block;
            margin-top: 30px;
            padding: 10px 20px;
            background: #2c3e50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
        .back-link:hover {
            background: #34495e;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${query}</h1>
        <div class="ava-summary">${avaSummary}</div>
    </div>
    
    <div class="results-grid">
        ${imageResults.map((item, index) => `
        <div class="result-card" data-index="${index}">
            <img src="${item.link}" alt="${item.title || query}" class="result-image" onerror="this.style.display='none'">
            <div class="result-content">
                <div class="result-title">${item.title || 'Luxury Result'}</div>
                ${item.snippet ? `<p>${item.snippet}</p>` : ''}
                <a href="${item.image?.contextLink || '#'}" class="result-link" target="_blank">View Source</a>
            </div>
        </div>
        `).join('')}
    </div>
    
    <a href="/" class="back-link">← Back to Search</a>
    
    <script>
        // Fade in cards sequentially
        document.addEventListener('DOMContentLoaded', () => {
            const cards = document.querySelectorAll('.result-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('fade-in');
                }, index * 200);
            });
        });
    </script>
</body>
</html>`;

    // Save HTML to /searches/ directory
    const searchesDir = path.join(process.cwd(), 'searches');
    const filePath = path.join(searchesDir, `${slug}.html`);
    
    try {
      await fs.mkdir(searchesDir, { recursive: true });
      await fs.writeFile(filePath, html);
    } catch (err) {
      // Continue even if file writing fails
    }

    // Update /searches/index.html
    const indexPath = path.join(searchesDir, 'index.html');
    const newLink = `<li><a href="${slug}.html">${query}</a></li>\n`;
    
    try {
      let indexContent;
      try {
        indexContent = await fs.readFile(indexPath, 'utf8');
        // Append new link before closing </ul>
        indexContent = indexContent.replace('</ul>', `    ${newLink}</ul>`);
      } catch {
        // Create new index.html if it doesn't exist
        indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search Results | Opulent Shipyard Monaco</title>
    <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; }
        ul { list-style: none; padding: 0; }
        li { margin: 10px 0; }
        a { color: #3498db; text-decoration: none; font-size: 1.1em; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Search Results</h1>
    <ul>
    ${newLink}</ul>
    <a href="/">← Back to Search</a>
</body>
</html>`;
      }
      
      await fs.writeFile(indexPath, indexContent);
    } catch (err) {
      // Continue even if index update fails
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: html
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: `<html><body><h1>Error</h1><p>Something went wrong: ${error.message}</p></body></html>`
    };
  }
};
