/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { BoundsScreen } from "./bounds/BoundsScreen.js";
import DoubleIntegralBuilderColors from "./DoubleIntegralBuilderColors.js";
import { StringManager } from "./i18n/StringManager.js";
import { DoubleIntegralBuilderPreferencesModel } from "./preferences/DoubleIntegralBuilderPreferencesModel.js";
import { DoubleIntegralBuilderPreferencesNode } from "./preferences/DoubleIntegralBuilderPreferencesNode.js";
import { VolumeScreen } from "./volume/VolumeScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from doubleIntegralBuilderQueryParameters.
  const simPreferences = new DoubleIntegralBuilderPreferencesModel();

  const screens = [
    new VolumeScreen({
      name: stringManager.getScreenNames().volumeStringProperty,
      tandem: Tandem.ROOT.createTandem("volumeScreen"),
      backgroundColorProperty: DoubleIntegralBuilderColors.backgroundColorProperty,
    }),
    new BoundsScreen({
      name: stringManager.getScreenNames().boundsStringProperty,
      tandem: Tandem.ROOT.createTandem("boundsScreen"),
      backgroundColorProperty: DoubleIntegralBuilderColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new DoubleIntegralBuilderPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  sim.start();
});
