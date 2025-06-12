# analyze_attachment

The `analyze_attachment` tool analyzes Targetprocess attachments, especially images, and displays them directly in chat for AI vision analysis. It downloads attachment content and metadata for comprehensive analysis.

## Purpose

Use this tool when you need to:
- Analyze attachment content, especially images
- Download attachment metadata and content
- Display images directly in chat for AI vision analysis
- Correlate visual content with bug reports or user stories

## Parameters

```json
{
  "attachmentId": 123,          // Required: ID of the attachment to analyze
  "analysisType": "basic"       // Optional: "basic" (metadata only) or "detailed" (includes image display)
}
```

## Parameter Details

### attachmentId (Required)
The unique identifier of the attachment to analyze. This must be a number.

### analysisType (Optional)
The type of analysis to perform:

- `basic`: Returns only metadata about the attachment
- `detailed`: Includes image display for direct Claude analysis (for image files)

Default is `basic`.

## Response Format

The tool returns a text response with structured information about the attachment:

### Basic Analysis
- File information (name, type, size, upload date, owner)
- Content type analysis
- Associated entity information

### Detailed Analysis (for images)
- All basic analysis information
- Direct image display in chat using data URLs
- AI analysis instructions and suggestions
- Context about the associated bug/entity

Example response structure:

```
🔍 **Attachment Analysis Report**

📁 **File Information:**
- Name: screenshot.png
- Type: image/png
- Size: 256 KB
- Upload Date: 2024-01-15T10:30:00Z
- Owner: John Smith

🖼️ **Image Analysis:**
- Format: image/png
- Content available for direct AI analysis in this chat

🤖 **Ready for AI Vision Analysis:**
The image below can be analyzed directly by Claude's vision capabilities...

📊 **Image for Direct Analysis:**

![Attachment 123](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...)

🔗 **Associated Bug/Entity:**
- ID: 456
- Title: "Login button not working on mobile"
```

## Examples

### Basic Attachment Analysis

Get metadata about an attachment:

```json
{
  "attachmentId": 123,
  "analysisType": "basic"
}
```

### Detailed Image Analysis

Get full analysis with image display for AI vision:

```json
{
  "attachmentId": 123,
  "analysisType": "detailed"
}
```

## Common Errors

### Attachment Not Found
```
Attachment analysis failed: Entity with id 123 not found
```
**Solution:** Verify the attachment ID is correct and exists.

### Invalid Attachment ID
```
Invalid attachment analysis parameters: attachmentId must be a number
```
**Solution:** Ensure the attachment ID is a valid number.

### Download Failed
```
❌ Unable to download content for attachment 123
```
**Solution:** Check network connectivity and attachment permissions.

## Tips and Best Practices

1. **Use Basic First**: Start with `analysisType: "basic"` to get metadata quickly
2. **Detailed for Images**: Use `analysisType: "detailed"` only for images you want to analyze visually
3. **Large Files**: Be aware that detailed analysis of large images may take longer
4. **AI Analysis**: After detailed analysis, you can ask Claude specific questions about the displayed image
5. **Context Correlation**: Use the entity information to understand how the attachment relates to the bug/story

## Supported File Types

### Images (with detailed analysis support)
- PNG, JPEG, GIF, BMP, WebP
- Displayed directly in chat for AI vision analysis

### Other Files (basic analysis only)
- Documents: PDF, Word, Excel, PowerPoint
- Text files: TXT, CSV, JSON, XML
- Archives: ZIP, RAR, 7Z
- Code files: JS, TS, HTML, CSS

## Integration with Other Tools

The `analyze_attachment` tool works well with:

- `get_entity`: Find entities and their attachment IDs
- `search_entities`: Search for entities with attachments
- Knowledge about specific attachment IDs from bug reports

Example workflow:
1. Use `search_entities` to find bugs with attachments
2. Use `analyze_attachment` to examine specific attachments
3. Ask Claude to analyze the displayed images for insights
