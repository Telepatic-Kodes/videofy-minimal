"use client";

import { Dropdown, Image, MenuProps } from "antd";
import { ImageType, MapType, MediaAssetType, VideoType } from "@videofy/types";
import EditAssetButton from "./EditAssetButton";
import EditImage from "./EditImage";
import { useReactive } from "ahooks";
import EditVideo from "./EditVideo";
import MapComponent from "./Map";
import EditMap from "./EditMap";
import { FC } from "react";

interface MediaAssetProps {
  value?: MediaAssetType;
  onChange?: (value?: MediaAssetType) => void;
  allMedia?: MediaAssetType[];
  editable?: boolean;
}

// Chevron-down icon
const IconChevron = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const mediaMenuItems = [
  { key: "image", label: "Image" },
  { key: "video", label: "Video" },
  { key: "map", label: "Map" },
];

const MediaAsset: FC<MediaAssetProps> = ({
  value,
  onChange = () => {},
  allMedia = [],
  editable = true,
}) => {
  const state = useReactive({
    isEditAssetOpen: false,
    addType: undefined as string | undefined,
  });

  function handleChange(newValue: MediaAssetType | undefined) {
    onChange(newValue);
    state.addType = undefined;
  }

  function handleClose() {
    state.isEditAssetOpen = false;
    state.addType = undefined;
  }

  const handleAddMenuClick: MenuProps["onClick"] = (clickedItem) => {
    state.addType = clickedItem.key;
    state.isEditAssetOpen = true;
  };

  const handleReplaceMenuClick: MenuProps["onClick"] = (clickedItem) => {
    onChange(undefined);
    state.addType = clickedItem.key;
    state.isEditAssetOpen = true;
  };

  return (
    <div className="w-full aspect-square text-center">
      {!value && (
        <div
          className="relative w-full aspect-square flex items-center
            justify-center"
          style={{
            border: "1px dashed var(--border-2)",
            borderRadius: "var(--radius)",
            background: "var(--surface-2)",
          }}
        >
          <Dropdown
            menu={{ items: mediaMenuItems, onClick: handleAddMenuClick }}
          >
            <button
              type="button"
              className="vf-btn vf-btn-ghost"
              style={{ gap: 6 }}
            >
              Add media <IconChevron />
            </button>
          </Dropdown>
        </div>
      )}

      {value?.type === "image" && (
        <div className="relative">
          <Image
            key={value.imageAsset.id}
            className="rounded-xl w-full object-cover aspect-square"
            src={value.url}
          />
          {editable && (
            <EditAssetButton
              onClick={() => (state.isEditAssetOpen = true)}
              tooltipText="Edit image"
            />
          )}
        </div>
      )}

      {value?.type === "video" && (
        <div className="relative" key={value.videoAsset.id}>
          <video
            controls
            className="rounded-xl w-full object-cover aspect-square cursor-pointer"
            draggable="false"
            onClick={() => (state.isEditAssetOpen = true)}
          >
            <source src={value?.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {editable && (
            <EditAssetButton
              onClick={() => (state.isEditAssetOpen = true)}
              tooltipText="Edit video"
            />
          )}
        </div>
      )}

      {value?.type === "map" && (
        <div
          className="relative"
          key={value.location.lat + value.location.lon}
        >
          <MapComponent
            onClick={() => (state.isEditAssetOpen = true)}
            location={value.location}
            zoom={6}
            interactive={false}
          />
          <EditAssetButton
            onClick={() => (state.isEditAssetOpen = true)}
            tooltipText="Edit map"
          />
        </div>
      )}

      {value?.type && editable && (
        <Dropdown
          menu={{ items: mediaMenuItems, onClick: handleReplaceMenuClick }}
          className="mt-2"
        >
          <button
            type="button"
            className="vf-btn vf-btn-ghost"
            style={{ gap: 6, fontSize: 12, padding: "4px 10px" }}
          >
            Replace with... <IconChevron />
          </button>
        </Dropdown>
      )}

      {state.isEditAssetOpen && (
        <>
          {(value?.type === "image" || state.addType === "image") && (
            <EditImage
              image={value as unknown as ImageType}
              onClose={handleClose}
              onSave={handleChange}
              alternativeMedia={allMedia}
            />
          )}
          {(value?.type === "video" || state.addType === "video") && (
            <EditVideo
              video={value as unknown as VideoType}
              onClose={handleClose}
              onSave={handleChange}
              alternativeMedia={allMedia}
            />
          )}
          {(value?.type === "map" || state.addType === "map") && (
            <EditMap
              map={value as unknown as MapType}
              onClose={handleClose}
              onSave={handleChange}
              alternativeMedia={allMedia}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MediaAsset;
