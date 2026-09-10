import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from "react-native";
import Svg, { Path } from "react-native-svg";

/**
 * "Continue with Google" / "Sign in with Google" button, built to match Google's
 * official branding guidelines (light theme, pill shape):
 * https://developers.google.com/identity/branding-guidelines
 *
 * - Fill #FFFFFF, 1px inside stroke #747775, text #1F1F1F.
 * - The "G" mark is the real 4-color Google logo (not a monochrome icon font glyph —
 *   the guidelines explicitly disallow that), reproduced as SVG since we don't have
 *   network access in this environment to pull Google's pre-approved asset bundle.
 * - Padding matches Google's iOS reference spec: 16px before the logo, 12px between
 *   the logo and text, 16px after the text.
 */

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
        c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
        c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039
        l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
        c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
        c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </Svg>
  );
}

type Props = TouchableOpacityProps & {
  label?: string;
};

export function GoogleButton({ label = "Continue with Google", style, ...rest }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={[styles.button, style]} {...rest}>
      <GoogleLogo size={20} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#747775",
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 12,
  },
  label: {
    marginLeft: 12,
    color: "#1F1F1F",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});
