# Local Media Embedder Plugin

The Local Media Embedder plugin for Obsidian allows you to easily embed local media files (images, videos, audio) into your notes. This plugin enhances your note-taking experience by enabling seamless integration of multimedia content.

## Features

- **Embed local media files**: Support for images, videos, and audio files directly into your notes
- **Multiple embed methods**: Use code blocks or traditional HTML tag embedding  
- **Enhanced security**: Path validation and sanitization to prevent unauthorized file access
- **File picker integration**: Easy media selection with built-in file browser
- **Extensive format support**: 
  - **Images**: PNG, GIF, JPG, JPEG, WebP, SVG
  - **Videos**: MP4, WebM, OGG, OGV, AVI, MOV  
  - **Audio**: MP3, WAV, OGA, WebA, M4A, FLAC
- **Configurable settings**: Customizable server port, dimensions, caching options
- **Performance optimized**: Optional HTTP caching for faster loading
- **Real-time server status**: Visual indicators for server status in status bar and ribbon

## Installation

The plugin is not yet available in the Obsidian Community Plugins gallery. You can install the plugin manually by following these steps:

### Manual Installation

1. Download the plugin from GitHub releases
2. Extract the contents of the zip file to your Obsidian plugins directory: `{VaultFolder}/.obsidian/plugins/`
3. Enable the plugin in Obsidian by navigating to `Settings` > `Community plugins` > `Installed plugins` and toggling the Local Media Embedder plugin

### Using BRAT

Add the repository URL to the BRAT Plugin and it will automatically download and install the plugin for you.

## Usage

### Code Block Method (Recommended)

Use the new code block syntax for embedding media files:

```markdown
 ```media
path: /path/to/your/media/file.mp4
type: video
width: 640
height: 360
 ```
```

### Available Commands

- **Embed with file picker**: Opens a file browser to select media files
- **Embed as code block (from selection)**: Converts selected file path to code block
- **Embed in iframe tag**: Legacy method using iframe embedding
- **Embed in video tag**: Legacy method using HTML video tag
- **Embed in audio tag**: Legacy method using HTML audio tag
- **Toggle local media server**: Start/stop the local media server

### Settings

Configure the plugin through `Settings` > `Local Media Embedder`:

- **Server Port**: Port number for the local media server (default: 5555)
- **Base URL**: Base URL for the local server (default: http://127.0.0.1)
- **Default Dimensions**: Set default width and height for embedded media
- **Enable Caching**: Improve performance with HTTP caching headers
- **Context Menu**: Show/hide the embed option in right-click menus

## Security Features

- **Path validation**: Only allows access to valid media files
- **Type checking**: Validates file extensions against allowed media formats
- **Local server binding**: Server binds only to localhost (127.0.0.1) for security
- **Directory traversal protection**: Prevents access to unauthorized directories

## Demo

![Usage Demo](v2image.gif)

## Acknowledgements

Special thanks to the Obsidian developers and community for their support and feedback.