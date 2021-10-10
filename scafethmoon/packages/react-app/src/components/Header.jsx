import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://github.com/austintgriffith/scaffold-eth" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="🤖 🚀 ♂ Mars-Shot Bots (Made w/ Scaffold-ETH 🏗)"
        subTitle=""
        style={{ cursor: "pointer" }, {backgroundColor: '#ff79b5'}}
      />
    </a>
  );
}
