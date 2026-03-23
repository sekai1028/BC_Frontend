/**
 * Match HF-Back/config/sscConstants.js — SSC economy reference numbers.
 *
 * Chart round: Seconds_Played × SSC_PER_SECOND_ROUND = SSC_Earned (e.g. 30s → 0.000198).
 * Terminal idle (on chart page): SSC_PER_MINUTE_TERMINAL_IDLE per minute only while banner ads are verified serving.
 * Video ad reward: SSC_VIDEO_AD (+0.00200 display).
 */
export const SSC_PER_SECOND_ROUND = 0.0000066
export const SSC_PER_MINUTE_TERMINAL_IDLE = 0.0004
/** Per second average for HUD roll between server idle pushes — must match server */
export const SSC_SITE_IDLE_PER_SECOND = SSC_PER_MINUTE_TERMINAL_IDLE / 60
export const SSC_VIDEO_AD = 0.002
