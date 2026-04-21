import BrowseClient from "./BrowseClient";

export const metadata = {
  title: "Browse",
  description: "Browse every show in the PillarBoxd catalog.",
};

export default function BrowsePage() {
  return <BrowseClient />;
}
