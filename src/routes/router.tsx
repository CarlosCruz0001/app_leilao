import { RouteObject } from "react-router-dom";
import Home from "../pages/Home";
import SignupScreen from "../pages/cadastroPage";
import LoginScreen from "../pages/loginPage";
import CreateAuctionScreen from "../pages/criarLeilao";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/signUp",
    element: <SignupScreen />,
  },
  {
    path: "/login",
    element: <LoginScreen />,
  },
  {
    path: "/CriarLeilao",
    element: <CreateAuctionScreen />,
  },
];

export default routes;
