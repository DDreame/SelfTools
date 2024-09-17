export interface Tool {
  id: string;
  name: string;
  type: string;
  subtype: string;
  component: React.ComponentType<any>;
}
