const state = {
  // put shared app state here when we know the domain
};

const listeners = new Set();

export const store = {
  getState() {
    return structuredClone ? structuredClone(state) : JSON.parse(JSON.stringify(state));
  },

  setState(partial) {
    Object.assign(state, partial);
    listeners.forEach((fn) => fn(this.getState()));
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
