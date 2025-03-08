declare module 'react-force-graph' {
  import React from 'react';
  
  export interface ForceGraphProps {
    graphData: {
      nodes: Array<{
        id: string;
        name?: string;
        group?: number;
        val?: number;
        [key: string]: any;
      }>;
      links: Array<{
        source: string;
        target: string;
        value?: number;
        [key: string]: any;
      }>;
    };
    nodeLabel?: string | ((node: any) => string);
    nodeColor?: string | ((node: any) => string);
    nodeCanvasObject?: (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => void;
    onNodeClick?: (node: any) => void;
    linkWidth?: number | ((link: any) => number);
    linkColor?: string | ((link: any) => string);
    width?: number;
    height?: number;
    [key: string]: any;
  }
  
  export class ForceGraph2D extends React.Component<ForceGraphProps> {}
  export class ForceGraph3D extends React.Component<ForceGraphProps> {}
  export class ForceGraphVR extends React.Component<ForceGraphProps> {}
  export class ForceGraphAR extends React.Component<ForceGraphProps> {}
}
