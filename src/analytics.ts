export type TimerSource = 'main' | 'pip_widget' | 'calendar';

// Analytics stubs -- replace with real implementation when Amplitude is configured for the team project
export function trackTimerStarted(_projectName: string, _isBillable: boolean, _source: TimerSource) {}
export function trackTimerPaused(_projectName: string, _isBillable: boolean, _durationSeconds: number, _source: TimerSource) {}
export function trackTimerStopped(_projectName: string, _isBillable: boolean, _durationSeconds: number, _source: TimerSource) {}
export function trackPopOutClicked() {}
export function trackNoteViewed(_projectName: string, _isBillable: boolean) {}
export function trackNoteSubmitted(_projectName: string, _isBillable: boolean, _noteText: string) {}
export function trackNoteSkipped(_projectName: string, _isBillable: boolean) {}
export function trackProjectAdded(_projectName: string, _isBillable: boolean) {}
export function trackProjectDeleted(_projectName: string, _isBillable: boolean) {}
