import React, { useState } from "react";
import { List, ListItemButton, ListItemText, Collapse, IconButton } from "@mui/material";
import { ExpandMore, ChevronRight } from "@mui/icons-material";

const TreeNode = ({ nodeKey, nodeData, parentKey = "", handleQueueClick, level = 0 }) => {
  const [open, setOpen] = useState(false);

  const nodeId = parentKey ? `${parentKey}/${nodeKey}` : nodeKey;
  const children = nodeData.children || {};
  const hasChildren = Object.keys(children).length > 0;
  const label =  nodeKey;

  // Determine if it's a leaf node (no children)
  const isLeaf = !hasChildren;

  return (
    <>
      <ListItemButton
        sx={{ pl: 2 + level * 2 }}
        onClick={() => {
          if (isLeaf && nodeData.__data__) {
            handleQueueClick(nodeData.__data__);
          } else {
            setOpen(!open);
          }
        }}
      >
        {hasChildren ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // prevent ListItemButton's onClick
              setOpen(!open);
            }}
            sx={{ mr: 1 }}
          >
            {open ? <ExpandMore /> : <ChevronRight />}
          </IconButton>
        ) : (
          // to align label with nodes that have icons
          <div style={{ width: 24, marginRight: 8 }} />
        )}
        <ListItemText primary={label} />
      </ListItemButton>

      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {Object.entries(children).map(([childKey, childData]) => (
              <TreeNode
                key={`${nodeId}/${childKey}`}
                nodeKey={childKey}
                nodeData={childData}
                parentKey={nodeId}
                handleQueueClick={handleQueueClick}
                level={level + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const QueueTree = ({ queueTree, handleQueueClick }) => {
  return (
    <List sx={{ maxWidth: 600, bgcolor: "background.paper", p: 1 }}>
      {Object.entries(queueTree).map(([key, value]) => (
        <TreeNode
          key={key}
          nodeKey={key}
          nodeData={value}
          handleQueueClick={handleQueueClick}
          level={0}
        />
      ))}
    </List>
  );
};

export default QueueTree;
