function hashArray(arr: any[]): string {
  const result: string[] = [];

  function hashElement(element: any): string {
    if (Array.isArray(element)) {
      return hashArray(element);
    }
    else if (typeof element === 'object' && element !== null) {
      const objectKeys = Object.keys(element).sort();
      const objectString = objectKeys.map((key) => {
        const value = element[key];
        return `${key}:${value !== undefined && value !== null ? hashElement(value) : 'null'}`;
      }).join(',');
      return `{${objectString}}`;
    }
    else {
      return element !== undefined && element !== null ? element.toString() : 'null';
    }
  }

  arr.forEach((element) => {
    result.push(hashElement(element));
  });

  return result.join('|');
}
export function isEqual(arr1: any[], arr2: any[]): boolean {
  if (arr1.length !== arr2.length) return false;
  return hashArray(arr1) === hashArray(arr2);
}
