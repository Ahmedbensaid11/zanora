// app/stores/propertyStore.ts
let selectedProperty: any = null;

export const setSelectedProperty = (property: any) => {
  selectedProperty = property;
};

export const getSelectedProperty = () => selectedProperty;