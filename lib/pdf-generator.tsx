import { Document, Page, Text, View, Font } from "@react-pdf/renderer";
import type { RoutineDay } from "./types";

// Register Bangla font
Font.register({
  family: "HindSiliguri",
  fonts: [
    { src: "https://fonts.gstatic.com/s/hindsiliguri/v12/ijwTs5juQtsqLLdNIgBJcDYSA66Q.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/hindsiliguri/v12/ijwOs5juQtsqLLdNIgBJcF6CfNKO_Q.ttf", fontWeight: 700 },
  ],
});

const THEME = {
  bg: "#4A1520",
  headerBg: "#E31E24",
  accent: "#FFD700",
  rowAlt: "#5A2030",
};

const phaseBannerColors: Record<number, { bg: string; accent: string; name: string }> = {
  1: { bg: "#E31E24", accent: "#FFD700", name: "ফাউন্ডেশন মোড" },
  2: { bg: "#D97706", accent: "#F59E0B", name: "প্র্যাকটিস গ্রাইন্ড" },
  3: { bg: "#16A34A", accent: "#22C55E", name: "ফাইনাল রিভিশন" },
};

interface Props {
  name: string;
  section: string;
  durationDays: number;
  routine: RoutineDay[];
}

export default function RoutinePDF({
  name,
  section,
  durationDays,
  routine,
}: Props) {
  const totalHours = Math.round(
    routine.reduce((s, d) => s + d.totalTimeMin, 0) / 60
  );

  // Track phase transitions
  let currentPhase = 0;

  return (
    <Document>
      <Page
        size="A4"
        style={{
          backgroundColor: THEME.bg,
          padding: 20,
          color: "white",
          fontSize: 7,
          fontFamily: "HindSiliguri",
        }}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: THEME.headerBg,
            borderRadius: 4,
            padding: "8 12",
            marginBottom: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 14, fontWeight: 700, color: "white" }}>
              SSC 27 SMART ROUTINE
            </Text>
            <Text
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.8)",
                marginTop: 2,
              }}
            >
              {name}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 9, fontWeight: 600, color: "white" }}>
              {section}
            </Text>
            <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.7)" }}>
              {durationDays} days
            </Text>
          </View>
        </View>

        {/* Summary block */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 3,
              padding: "4 8",
            }}
          >
            <Text style={{ fontSize: 6, color: "rgba(255,255,255,0.6)" }}>
              Total Days
            </Text>
            <Text
              style={{ fontSize: 10, fontWeight: 700, color: THEME.accent }}
            >
              {durationDays}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 3,
              padding: "4 8",
            }}
          >
            <Text style={{ fontSize: 6, color: "rgba(255,255,255,0.6)" }}>
              Total Hours
            </Text>
            <Text
              style={{ fontSize: 10, fontWeight: 700, color: THEME.accent }}
            >
              ~{totalHours}h
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 3,
              padding: "4 8",
            }}
          >
            <Text style={{ fontSize: 6, color: "rgba(255,255,255,0.6)" }}>
              10 Minute School
            </Text>
            <Text
              style={{ fontSize: 10, fontWeight: 700, color: THEME.accent }}
            >
              SSC 27
            </Text>
          </View>
        </View>

        {/* Column headers */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 2,
            padding: "4 6",
            marginBottom: 4,
          }}
        >
          <Text style={{ width: "9%", fontWeight: 700, fontSize: 6.5 }}>
            DAY
          </Text>
          <Text style={{ width: "20%", fontWeight: 700, fontSize: 6.5 }}>
            Subject
          </Text>
          <Text style={{ width: "30%", fontWeight: 700, fontSize: 6.5 }}>
            Chapter
          </Text>
          <Text style={{ width: "18%", fontWeight: 700, fontSize: 6.5 }}>
            Type
          </Text>
          <Text
            style={{
              width: "13%",
              fontWeight: 700,
              fontSize: 6.5,
              textAlign: "right",
            }}
          >
            Time
          </Text>
          <Text
            style={{
              width: "10%",
              fontWeight: 700,
              fontSize: 6.5,
              textAlign: "center",
            }}
          >
            Done
          </Text>
        </View>

        {/* All days sequentially with phase banners */}
        {routine.map((day, dayIdx) => {
          const showPhaseBanner = day.phase !== currentPhase;
          currentPhase = day.phase;
          const phaseBanner = phaseBannerColors[day.phase] || phaseBannerColors[1];

          return (
            <View key={day.dayNumber}>
              {/* Phase banner */}
              {showPhaseBanner && (
                <View
                  style={{
                    backgroundColor: phaseBanner.bg,
                    borderRadius: 3,
                    padding: "5 10",
                    marginTop: dayIdx > 0 ? 6 : 0,
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "white",
                    }}
                  >
                    {phaseBanner.name}
                  </Text>
                </View>
              )}

              {/* Day block — don't split across pages */}
              <View wrap={false}>
                {day.entries.map((entry, i) => (
                  <View
                    key={`${day.dayNumber}-${i}`}
                    style={{
                      flexDirection: "row",
                      backgroundColor:
                        dayIdx % 2 === 0 ? "transparent" : THEME.rowAlt,
                      padding: "3 6",
                      alignItems: "center",
                      borderLeft: day.isExtreme
                        ? `2 solid ${THEME.accent}`
                        : "none",
                    }}
                  >
                    <Text
                      style={{
                        width: "9%",
                        fontWeight: i === 0 ? 700 : 400,
                        fontSize: 7,
                      }}
                    >
                      {i === 0
                        ? `Day ${day.dayNumber}${day.isExtreme ? " \u26A1" : ""}`
                        : ""}
                    </Text>
                    <Text style={{ width: "20%", fontSize: 7 }}>
                      {entry.subject.substring(0, 15)}
                    </Text>
                    <Text
                      style={{
                        width: "30%",
                        fontSize: 6.5,
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      {entry.chapterName.substring(0, 25)}
                    </Text>
                    <Text
                      style={{
                        width: "18%",
                        fontSize: 6.5,
                        color: THEME.accent,
                      }}
                    >
                      {entry.taskType}
                    </Text>
                    <Text
                      style={{
                        width: "13%",
                        fontSize: 7,
                        textAlign: "right",
                      }}
                    >
                      {entry.timeMin}m
                    </Text>
                    <Text
                      style={{
                        width: "10%",
                        fontSize: 8,
                        textAlign: "center",
                      }}
                    >
                      {"\u2610"}
                    </Text>
                  </View>
                ))}
                {/* Day total */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    padding: "2 6",
                    opacity: 0.6,
                  }}
                >
                  <Text style={{ fontSize: 6 }}>
                    ~{(day.totalTimeMin / 60).toFixed(1)}h
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Footer */}
        <View
          style={{
            position: "absolute",
            bottom: 15,
            left: 20,
            right: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          fixed
        >
          <Text style={{ fontSize: 6, color: "rgba(255,255,255,0.4)" }}>
            10 Minute School Smart Routine Generator
          </Text>
          <View
            style={{
              backgroundColor: THEME.headerBg,
              borderRadius: 3,
              padding: "3 8",
            }}
          >
            <Text style={{ fontSize: 7, fontWeight: 600, color: "white" }}>
              SSC 27 Complete Prep — Enroll Now!
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
