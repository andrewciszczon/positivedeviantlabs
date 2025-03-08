declare module 'vis-timeline/standalone' {
  import { DataSet } from 'vis-data';

  export type TimelineItem = {
    id: number | string;
    content: string;
    start: Date | string | number;
    end?: Date | string | number;
    group?: number | string;
    className?: string;
    title?: string;
    [key: string]: any;
  };

  export type TimelineGroup = {
    id: number | string;
    content: string;
    [key: string]: any;
  };

  export type TimelineOptions = {
    height?: string | number;
    width?: string | number;
    min?: Date | string | number;
    max?: Date | string | number;
    zoomable?: boolean;
    horizontalScroll?: boolean;
    zoomKey?: string;
    orientation?: 'top' | 'bottom' | string;
    groupOrder?: string | ((a: any, b: any) => number);
    tooltip?: {
      followMouse?: boolean;
      overflowMethod?: 'cap' | 'flip' | 'none' | string;
      [key: string]: any;
    };
    [key: string]: any;
  };

  export class Timeline {
    constructor(
      container: HTMLElement,
      items: TimelineItem[] | DataSet<TimelineItem>,
      groups: TimelineGroup[] | DataSet<TimelineGroup>,
      options?: TimelineOptions
    );

    on(event: string, callback: (properties: any) => void): void;
    moveTo(time: Date | string | number, options?: any): void;
    destroy(): void;
  }
}
