import path from "path";
import { fileURLToPath } from "url";
import { ComponentLoader } from "adminjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentLoader = new ComponentLoader();

const Components = {
  Dashboard: componentLoader.add(
    "Dashboard",
    path.join(__dirname, "./components/Dashboard.jsx")
  ),
  Exports: componentLoader.add(
    "Exports",
    path.join(__dirname, "./components/Exports.jsx")
  ),
};

export { componentLoader, Components };