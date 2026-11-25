import Chime from "../../../components/Chime";

// a 404 that still plays: the browser's stored units, and a line saying the address named nothing
export default function NotFound() {
  return <Chime notice="COMPOSITION NOT FOUND" />;
}
