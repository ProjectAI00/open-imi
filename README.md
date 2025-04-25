# Open IMI

Open Imi is a open source claude desktop alternative for developers, engineers and tech teams to hack MCP's and agents to their own liking.

([OpenAI](https://openai.com/), [Anthropic](https://www.anthropic.com/), [Google](https://ai.google.dev/), [Ollama](https://ollama.com/), etc.) while connecting powerful AI tools through [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction).

> This project was developed using mcp-client-chatbot from ( https://github.com/cgoinglove ) and Vercel's open source libraries such as [Next.js](https://nextjs.org/) and [AI SDK](https://sdk.vercel.ai/)[shadcn/ui](https://ui.shadcn.com/), and is designed to run immediately in local environments or personal servers without complex setup. You can easily add and experiment with AI tools through file-based MCP management.


## Installation

This project uses [pnpm](https://pnpm.io/) as the recommended package manager.

### Quick Start

```bash
# Install dependencies
pnpm i

# Initialize the project (creates .env file from .env.example and sets up the database)
pnpm initial

# Start the development server
pnpm dev
```

After running these commands, you can access the application at http://localhost:3000.

### Environment Setup

After running `pnpm initial`, make sure to edit your `.env` file to add the necessary API keys for the providers you want to use:

```
GOOGLE_GENERATIVE_AI_API_KEY=****
OPENAI_API_KEY=****
```

By default, the application uses SQLite for data storage. If you prefer to use PostgreSQL, you can modify the `USE_FILE_SYSTEM_DB` value in your `.env` file and set up your database connection string.

### Setting Up MCP Servers

You can add MCP servers in two ways:

1.  Using the UI: Navigate to http://localhost:3000/mcp in your browser and use the interface to add and configure MCP servers.
2.  Editing the config file: Directly modify the `.mcp-config.json` file in the project root directory.
3.  Custom server logic: A customizable MCP server is already included in the project at `./custom-mcp-server/index.ts`.  
    You can modify this file to implement your own server logic or connect external tools as needed.

## Credits and Acknowledgements



### Massive Shoutout To

- **[cgoinglove](https://github.com/cgoinglove)** for [MCP Client Chatbot](https://github.com/cgoinglove/mcp-client-chatbot) - We forked parts of the MCP client connection with servers and MCP page JSON-based file system.

- **[Vercel AI Chatbot](https://github.com/vercel/ai-chatbot)** and its [53 contributors](https://github.com/vercel/ai-chatbot/graphs/contributors) - The original AI chat interface that Open IMI was built on top of, including:
  - [@jaredpalmer](https://github.com/jaredpalmer)
  - [@jeremyphilemon](https://github.com/jeremyphilemon)
  - [@shadcn](https://github.com/shadcn)
  - [@leerob](https://github.com/leerob)
  - [@shuding](https://github.com/shuding)
  - And [many more](https://github.com/vercel/ai-chatbot/graphs/contributors)

- **[LibreChat](https://github.com/danny-avila/LibreChat)** - For MCP connection logic that helped shape our implementation.

- **[21st.dev](https://21st.dev/)** - For the  UI components that enhance the user experience.


## License

This project is licensed under the same terms as the original repositories it's based on:
- [MCP Client Chatbot](https://github.com/cgoinglove/mcp-client-chatbot) is licensed under the MIT License
- [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) is licensed under the Apache License 2.0

Please refer to the respective repositories for more details on licensing.

