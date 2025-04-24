export class PriorityQueue {
  constructor() {
    this.values = [];
  }

  add(element, priority = 0) {
    this.values.push({ element, priority });
    this.sort();
  }

  remove() {
    if (this.isEmpty()) {
      return null;
    }
    return this.values.shift().element;
  }

  peek() {
    if (this.isEmpty()) {
      return null;
    }
    return this.values[0].element;
  }

  isEmpty() {
    return this.values.length === 0;
  }

  sort() {
    this.values.sort((a, b) => b.priority - a.priority);
  }

  clear() {
    this.values = [];
  }

  size() {
    return this.values.length;
  }
}