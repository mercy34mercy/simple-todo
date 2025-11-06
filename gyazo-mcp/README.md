# Gyazo MCP Server

A Model Context Protocol (MCP) server that integrates with the Gyazo API, enabling AI assistants to upload, list, retrieve, and manage images on Gyazo.

## Features

### Tools

- **upload_image** - Upload images to Gyazo
  - Base64 encoded image data
  - Optional title, description, collection ID, and referer URL
- **list_images** - List your uploaded images
  - Pagination support (page, per_page)
- **get_image** - Get detailed information about a specific image
  - Returns image metadata, OCR data if available
- **delete_image** - Delete an image from Gyazo
- **get_oembed** - Get oEmbed information for a Gyazo image URL

### Resources

- **gyazo://images** - Access your complete image list as a resource
- **gyazo://images/{image_id}** - Access specific image details as a resource

## Installation

```bash
cd gyazo-mcp
npm install
npm run build
```

## Configuration

### Get Your Gyazo Access Token

1. Visit [Gyazo OAuth Applications](https://gyazo.com/oauth/applications)
2. Create a new application or use an existing one
3. Copy your access token

### Set Environment Variable

Create a `.env` file in the project root:

```bash
GYAZO_ACCESS_TOKEN=your_access_token_here
```

Or set the environment variable directly:

```bash
export GYAZO_ACCESS_TOKEN=your_access_token_here
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gyazo": {
      "command": "node",
      "args": ["/absolute/path/to/gyazo-mcp/build/index.js"],
      "env": {
        "GYAZO_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Standalone

```bash
GYAZO_ACCESS_TOKEN=your_token npm start
```

## Example Interactions

### Upload an Image

```
User: "Upload this screenshot to Gyazo"
Assistant: [Uses upload_image tool with base64 image data]
```

### List Recent Images

```
User: "Show me my recent Gyazo uploads"
Assistant: [Uses list_images tool]
```

### Get Image Details

```
User: "Get details for image ID abc123"
Assistant: [Uses get_image tool with image_id: "abc123"]
```

### Delete an Image

```
User: "Delete the image with ID abc123"
Assistant: [Uses delete_image tool]
```

## API Reference

### upload_image

**Input:**
```typescript
{
  imagedata: string;      // Base64 encoded image (required)
  title?: string;         // Image title
  desc?: string;          // Image description
  collection_id?: string; // Collection ID
  referer_url?: string;   // Referer URL
}
```

**Output:**
```json
{
  "image_id": "xxxxx",
  "permalink_url": "https://gyazo.com/xxxxx",
  "url": "https://i.gyazo.com/xxxxx.png",
  "thumb_url": "https://thumb.gyazo.com/thumb/xxxxx.png",
  "type": "png"
}
```

### list_images

**Input:**
```typescript
{
  page?: number;     // Page number (default: 1)
  per_page?: number; // Items per page (default: 20, max: 100)
}
```

**Output:**
```json
[
  {
    "image_id": "xxxxx",
    "permalink_url": "https://gyazo.com/xxxxx",
    "url": "https://i.gyazo.com/xxxxx.png",
    "created_at": "2025-01-01T00:00:00+0000",
    "metadata": { ... }
  }
]
```

### get_image

**Input:**
```typescript
{
  image_id: string; // Image ID (required)
}
```

**Output:**
```json
{
  "image_id": "xxxxx",
  "permalink_url": "https://gyazo.com/xxxxx",
  "url": "https://i.gyazo.com/xxxxx.png",
  "thumb_url": "https://thumb.gyazo.com/thumb/xxxxx.png",
  "type": "png",
  "created_at": "2025-01-01T00:00:00+0000",
  "metadata": { ... },
  "ocr": { ... }
}
```

### delete_image

**Input:**
```typescript
{
  image_id: string; // Image ID to delete (required)
}
```

**Output:**
```json
{
  "success": true,
  "image_id": "xxxxx",
  "type": "png",
  "message": "Image deleted successfully"
}
```

### get_oembed

**Input:**
```typescript
{
  url: string; // Gyazo image URL (required)
}
```

**Output:**
```json
{
  "type": "photo",
  "version": "1.0",
  "provider_name": "Gyazo",
  "provider_url": "https://gyazo.com",
  ...
}
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

## Project Structure

```
gyazo-mcp/
├── src/
│   ├── index.ts           # Entry point
│   ├── server.ts          # MCP server implementation
│   └── gyazo-client.ts    # Gyazo API client
├── build/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Security

- Never commit your `.env` file or expose your access token
- Store your access token securely in environment variables
- Use `.gitignore` to exclude sensitive files

## Error Handling

All errors are returned in a consistent format:

```json
{
  "error": "ErrorName",
  "message": "Error description",
  "statusCode": 400
}
```

Common error types:
- **Authentication Error** - Invalid or missing access token
- **Not Found Error** - Image or resource not found
- **Validation Error** - Invalid parameters
- **Rate Limit Error** - API rate limit exceeded

## License

MIT

## Related Links

- [Gyazo API Documentation](https://gyazo.com/api/docs)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
