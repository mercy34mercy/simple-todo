import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { GyazoClient } from './gyazo-client.js';

export class GyazoMCPServer {
  private server: Server;
  private gyazoClient: GyazoClient;

  constructor(accessToken: string) {
    this.gyazoClient = new GyazoClient(accessToken);
    this.server = new Server(
      {
        name: 'gyazo-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'upload_image',
          description: 'Upload an image to Gyazo',
          inputSchema: {
            type: 'object',
            properties: {
              imagedata: {
                type: 'string',
                description: 'Base64 encoded image data',
              },
              title: {
                type: 'string',
                description: 'Image title (optional)',
              },
              desc: {
                type: 'string',
                description: 'Image description (optional)',
              },
              collection_id: {
                type: 'string',
                description: 'Collection ID (optional)',
              },
              referer_url: {
                type: 'string',
                description: 'Referer URL (optional)',
              },
            },
            required: ['imagedata'],
          },
        },
        {
          name: 'list_images',
          description: 'List uploaded images from Gyazo',
          inputSchema: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                description: 'Page number (default: 1)',
              },
              per_page: {
                type: 'number',
                description: 'Number of images per page (default: 20, max: 100)',
              },
            },
          },
        },
        {
          name: 'get_image',
          description: 'Get details of a specific image',
          inputSchema: {
            type: 'object',
            properties: {
              image_id: {
                type: 'string',
                description: 'Image ID',
              },
            },
            required: ['image_id'],
          },
        },
        {
          name: 'delete_image',
          description: 'Delete an image from Gyazo',
          inputSchema: {
            type: 'object',
            properties: {
              image_id: {
                type: 'string',
                description: 'Image ID to delete',
              },
            },
            required: ['image_id'],
          },
        },
        {
          name: 'get_oembed',
          description: 'Get oEmbed information for a Gyazo image URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'Gyazo image URL',
              },
            },
            required: ['url'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'upload_image': {
            const result = await this.gyazoClient.uploadImage(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'list_images': {
            const result = await this.gyazoClient.listImages(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'get_image': {
            const { image_id } = args as { image_id: string };
            const result = await this.gyazoClient.getImage(image_id);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'delete_image': {
            const { image_id } = args as { image_id: string };
            const result = await this.gyazoClient.deleteImage(image_id);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    { success: true, ...result, message: 'Image deleted successfully' },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'get_oembed': {
            const { url } = args as { url: string };
            const result = await this.gyazoClient.getOEmbed(url);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        const statusCode = error.response?.status;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: error.name || 'Error',
                  message: errorMessage,
                  statusCode,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'gyazo://images',
          name: 'Gyazo Images List',
          description: 'List of all uploaded images',
          mimeType: 'application/json',
        },
      ],
    }));

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        if (uri === 'gyazo://images') {
          const images = await this.gyazoClient.listImages();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(images, null, 2),
              },
            ],
          };
        }

        // Handle gyazo://images/{image_id}
        const imageIdMatch = uri.match(/^gyazo:\/\/images\/(.+)$/);
        if (imageIdMatch) {
          const imageId = imageIdMatch[1];
          const image = await this.gyazoClient.getImage(imageId);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(image, null, 2),
              },
            ],
          };
        }

        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
      } catch (error: any) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to read resource: ${error.message}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gyazo MCP server running on stdio');
  }
}
