const editor = new EditorJS({
  tools: {
    header: Header,
    checklist: {
      class: Checklist,
      inlineToolbar: true,
    },
    code: CodeTool,
    inlineCode: InlineCode,
    delimiter: Delimiter,
    embed: Embed,
    list: {
      class: List,
      inlineToolbar: true,
    },
    Marker: Marker,
    table: {
      class: Table,
      inlineToolbar: true
    },
    underline: Underline,
    quote: Quote
  }
});
