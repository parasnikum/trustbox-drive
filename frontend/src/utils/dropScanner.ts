export const scanDroppedItems = async (dataTransfer: DataTransfer): Promise<File[]> => {
  const files: File[] = [];

  const readEntry = async (entry: any, path = '') => {
    if (!entry) return;
    if (entry.isFile) {
      return new Promise<void>((resolve) => {
        entry.file((file: File) => {
          const relativePath = path ? `${path}/${file.name}` : file.name;
          Object.defineProperty(file, 'webkitRelativePath', {
            value: relativePath,
            writable: true,
          });
          files.push(file);
          resolve();
        });
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readAllEntries = async (): Promise<any[]> => {
        const entriesBatch: any[] = [];
        let batch: any[] = await new Promise((resolve) => dirReader.readEntries(resolve));
        while (batch.length > 0) {
          entriesBatch.push(...batch);
          batch = await new Promise((resolve) => dirReader.readEntries(resolve));
        }
        return entriesBatch;
      };

      const childEntries = await readAllEntries();
      for (const childEntry of childEntries) {
        await readEntry(childEntry, path ? `${path}/${entry.name}` : entry.name);
      }
    }
  };

  const items = dataTransfer.items;
  if (items && items.length > 0) {
    const promises: Promise<void>[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
      if (entry) {
        promises.push(readEntry(entry));
      } else {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    await Promise.all(promises);
  } else if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      files.push(dataTransfer.files[i]);
    }
  }

  return files;
};
