import {
  BasicActionsKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class VolumeKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const { controls } = StringManager.getInstance().getVolumeA11yStrings();
    super(
      [new BasicActionsKeyboardHelpSection()],
      [
        new SliderControlsKeyboardHelpSection(),
        new KeyboardHelpSection(controls.rotateSolidStringProperty, [
          KeyboardHelpSectionRow.labelWithIcon(
            controls.rotateSolidStringProperty,
            KeyboardHelpIconFactory.leftRightOrADKeysRowIcon(),
            { labelInnerContent: controls.rotateSolidHelpStringProperty },
          ),
          KeyboardHelpSectionRow.labelWithIconList(
            controls.rotateFineStringProperty,
            [
              KeyboardHelpIconFactory.shiftPlusIcon(KeyboardHelpIconFactory.leftRightArrowKeysRowIcon()),
              KeyboardHelpIconFactory.shiftPlusIcon(KeyboardHelpIconFactory.aDKeysRowIcon()),
            ],
            { labelInnerContent: controls.rotateFineHelpStringProperty },
          ),
        ]),
      ],
    );
  }
}
