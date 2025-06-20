const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: 'Method Not Allowed'
            };
        }

        // Get query from POST body
        const body = JSON.parse(event.body);
        const query = body.query.trim();

        // Create safe slug for filename
        const slug = query
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 80); // limit length

        const filename = `${slug}.html`;
        const filePath = path.join(__dirname, '..', '..', 'searches', filename);

        // Build HTML content (simple starter)
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${query} - Opulent Shipyard Monaco</title>
    <meta name="description" content="Result page for: ${query}">
</head>
<body>
    <h1>Search Result: ${query}</h1>
    <p>More content will go here...</p>
</body>
</html>`;

        // Save HTML file
        fs.writeFileSync(filePath, htmlContent, 'utf8');

        // Update llms.txt
        const llmsPath = path.join(__dirname, '..', '..', 'llms.txt');
        const url = `/searches/${filename}\n`;

        fs.appendFileSync(llmsPath, url, 'utf8');

        // Return new page URL
        return {
            statusCode: 200,
            body: JSON.stringify({
                url: `/searches/${filename}`
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (err) {
        console.error('Grow Error:', err);
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        };
    }
};
