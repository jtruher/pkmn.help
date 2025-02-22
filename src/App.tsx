import classNames from "classnames";
import * as React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Redirect, Route, Switch } from "react-router-dom";
import { useMediaQuery } from "usehooks-ts";
import { useRegisterSW } from "virtual:pwa-register/react";
import { CoverageType, Pokemon } from "./data-types";
import { detectLanguage } from "./detectLanguage";
import { formatPokemonName } from "./formatPokemonName";
import { MonsterImage } from "./MonsterImage";
import ScreenDefense from "./ScreenDefense";
import ScreenMore from "./ScreenMore";
import ScreenOffense from "./ScreenOffense";
import ScreenPokedex from "./ScreenPokedex";
import ScreenPokedexHelp from "./ScreenPokedexHelp";
import ScreenWeaknessCoverage from "./ScreenWeaknessCoverage";
import ScreenWeaknessList from "./ScreenWeaknessList";
import { PUBLIC_PATH } from "./settings";
import { useFetchJSON } from "./useFetchJSON";
import { useGeneration } from "./useGeneration";
import { useLanguage } from "./useLanguage";
import { useTheme } from "./useTheme";
import { useUpdateSW } from "./useUpdateSW";

const tabClass = classNames([
  "no-underline",
  "pv1 ph3 f5",
  "TabFocus",
  "tc b",
  "ba border1 br-pill",
  "bg1 fg1",
]);

const tabClassActive = classNames(["TabBar-Item-Selected"]);

function getFallback(key: string): string {
  if (key === "title") {
    return "Pokémon Type Calculator";
  }
  return "…";
}

function useTranslationsWithBlankFallback() {
  const { t: translation, ready } = useTranslation(undefined, {
    useSuspense: false,
  });
  return ready ? translation : getFallback;
}

export default function App() {
  // Service worker
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    // offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();
  useUpdateSW();

  async function updateApp() {
    setNeedRefresh(false);
    await updateServiceWorker(true);
  }

  const t = useTranslationsWithBlankFallback();
  const { i18n } = useTranslation(undefined, { useSuspense: false });

  // State...
  const [generation] = useGeneration();
  const [defenseParams, setDefenseParams] = React.useState("");
  const [offenseParams, setOffenseParams] = React.useState("");
  const [pokedexParams, setPokedexParams] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [coverageTypes, setCoverageTypes] = React.useState<CoverageType[]>([]);
  const [fallbackCoverageTypes, setFallbackCoverageTypes] = React.useState<
    CoverageType[]
  >([]);
  const [AllPokemon, setAllPokemon] = React.useState<Pokemon[]>([]);
  const [easterEgg, setEasterEgg] = React.useState<Pokemon>();
  const [easterEggLoadedID, setEasterEggLoadedID] = React.useState("");

  const [language] = useLanguage();

  React.useEffect(() => {
    async function load() {
      await i18n.changeLanguage(language || detectLanguage());
      document.documentElement.lang = i18n.language;
    }
    load();
  }, [language, i18n]);

  // Theme stuff
  const [theme] = useTheme();
  const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isDark = theme === "dark" || (theme === "auto" && isDarkMode);
  const themeColor = isDark ? "hsl(350, 70%, 40%)" : "hsl(357, 97%, 46%)";
  const themeAuto = isDarkMode ? "dark" : "light";

  // Load Pokédex JSON
  const jsonURL = new URL("data-pkmn.json", PUBLIC_PATH).href;
  const allPokemonResponse = useFetchJSON<Pokemon[]>(jsonURL);

  // Fallback coverage types
  React.useEffect(() => {
    if (allPokemonResponse.type !== "done") {
      return;
    }
    const allPokemon = allPokemonResponse.data;
    const fallbackCoverageTypes = allPokemon.map<CoverageType>((pkmn) => {
      const name = formatPokemonName({
        speciesName: pkmn.speciesNames[language] || pkmn.speciesNames.en,
        formName: pkmn.formNames[language] || pkmn.formNames.en,
      });
      const number = String(pkmn.number);
      const types = pkmn.types;
      return { number, name, types };
    });
    setIsLoading(false);
    setCoverageTypes(fallbackCoverageTypes);
    setFallbackCoverageTypes(fallbackCoverageTypes);
    setAllPokemon(allPokemon);
  }, [allPokemonResponse, language]);

  return (
    <HelmetProvider>
      <div className="flex-auto">
        <Helmet>
          <html data-theme={theme} data-theme-auto={themeAuto} />
          <meta name="theme-color" content={themeColor} />
        </Helmet>
        <h1 className="f3-ns f4 tc relative white PokeballHeader">
          <Link to="/" className="no-underline white OutlineFocus br1">
            {t("title")}
          </Link>
          <div
            className="PokeballHeaderButton"
            onClick={(event) => {
              event.preventDefault();
              const i = Math.floor(Math.random() * AllPokemon.length);
              const pkmn = AllPokemon[i];
              if (!pkmn) return;
              setEasterEgg(pkmn);
            }}
          />
          {easterEgg && (
            <div
              className="EasterEgg"
              data-animate={easterEggLoadedID === easterEgg.id}
            >
              <MonsterImage
                pokemonID={easterEgg.id}
                types={easterEgg.types}
                onLoad={({ pokemonID }) => {
                  setEasterEggLoadedID(pokemonID);
                }}
                scale={2}
              />
            </div>
          )}
        </h1>
        <nav className={classNames(["bg1", "bb border2 TabBar", "pb2 ph2"])}>
          <NavLink
            className={tabClass}
            activeClassName={tabClassActive}
            to={`/offense/${offenseParams}`}
          >
            {t("navigation.offense")}
          </NavLink>
          <NavLink
            className={tabClass}
            activeClassName={tabClassActive}
            to={`/defense/${defenseParams}`}
          >
            {t("navigation.defense")}
          </NavLink>
          <NavLink
            className={tabClass}
            activeClassName={tabClassActive}
            to={`/pokedex/${pokedexParams}`}
          >
            {t("navigation.pokedex")}
          </NavLink>
          <NavLink
            className={classNames(tabClass, needRefresh && "PleaseUpdate")}
            activeClassName={tabClassActive}
            to="/more/"
          >
            {t("navigation.more")}
          </NavLink>
        </nav>
        <React.Suspense fallback={<div className="Spinner center mt4 f2" />}>
          <Switch>
            <Route
              exact
              path="/offense/weakness-list/"
              render={() => (
                <ScreenWeaknessList
                  generation={generation}
                  coverageTypes={coverageTypes}
                />
              )}
            />
            <Route
              exact
              path="/offense/coverage/"
              render={() => (
                <ScreenWeaknessCoverage
                  setCoverageTypes={setCoverageTypes}
                  offenseParams={offenseParams}
                  fallbackCoverageTypes={fallbackCoverageTypes}
                  isLoading={isLoading}
                />
              )}
            />
            <Route
              exact
              path="/offense/"
              render={() => (
                <ScreenOffense
                  generation={generation}
                  coverageTypes={coverageTypes}
                  setCoverageTypes={setCoverageTypes}
                  setOffenseParams={setOffenseParams}
                  fallbackCoverageTypes={fallbackCoverageTypes}
                  isLoading={isLoading}
                />
              )}
            />
            <Route
              exact
              path="/defense/"
              render={() => (
                <ScreenDefense
                  generation={generation}
                  setDefenseParams={setDefenseParams}
                  fallbackCoverageTypes={fallbackCoverageTypes}
                />
              )}
            />
            <Route
              exact
              path="/pokedex/help/"
              render={() => <ScreenPokedexHelp pokedexParams={pokedexParams} />}
            />
            <Route
              exact
              path="/pokedex/"
              render={() => (
                <ScreenPokedex
                  setPokedexParams={setPokedexParams}
                  allPokemon={AllPokemon}
                  isLoading={isLoading}
                />
              )}
            />
            <Route
              exact
              path="/more/"
              render={() => (
                <ScreenMore
                  needsAppUpdate={needRefresh}
                  updateApp={updateApp}
                />
              )}
            />
            <Redirect to="/defense/" />
          </Switch>
        </React.Suspense>
      </div>
    </HelmetProvider>
  );
}
