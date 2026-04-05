/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tabs, Tooltip } from "antd";
import type { TabsProps as AntTabsProps } from "antd";

interface DraggableTabNodeProps extends React.HTMLAttributes<HTMLDivElement> {
  "data-node-key": string;
}

const DraggableTabNode: React.FC<Readonly<DraggableTabNodeProps>> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: props["data-node-key"],
    });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: "move",
  };

  return React.cloneElement(props.children as React.ReactElement<any>, {
    ref: setNodeRef,
    style,
    ...attributes,
    ...listeners,
  });
};

interface SortableTabsProps extends Omit<AntTabsProps, "items"> {
  items: NonNullable<AntTabsProps["items"]>;
  onReorder: (from: number, to: number) => void;
  onAdd?: () => void;
  allowAdd?: boolean;
}

const SortableTabs: React.FC<Readonly<SortableTabsProps>> = ({
  items,
  onReorder,
  onChange,
  onAdd,
  allowAdd = true,
  ...restProps
}) => {
  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id && items) {
      const activeIndex = items.findIndex((i) => i.key === active.id);
      const overIndex = items.findIndex((i) => i.key === over?.id);
      if (activeIndex !== -1 && overIndex !== -1) {
        onReorder(activeIndex, overIndex);
      }
    }
  };

  return (
    <Tabs
      tabBarExtraContent={
        allowAdd ? (
          <Tooltip title="Add article" placement="left">
            <button
              type="button"
              className="vf-btn vf-btn-icon vf-btn-primary"
              onClick={onAdd}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </Tooltip>
        ) : null
      }
      style={{ marginTop: 0 }}
      {...restProps}
      items={items}
      onChange={onChange} // Pass AntD's onChange to the Tabs component
      renderTabBar={(tabBarProps, DefaultTabBar) => (
        <DndContext
          sensors={[sensor]}
          onDragEnd={onDragEnd}
          collisionDetection={closestCenter}
        >
          <SortableContext
            items={items.map((i) => i.key)}
            strategy={horizontalListSortingStrategy}
          >
            <DefaultTabBar {...tabBarProps}>
              {(node) => (
                <DraggableTabNode
                  {...(node as React.ReactElement<DraggableTabNodeProps>).props}
                  key={node.key}
                >
                  {node}
                </DraggableTabNode>
              )}
            </DefaultTabBar>
          </SortableContext>
        </DndContext>
      )}
    />
  );
};

export default SortableTabs;
