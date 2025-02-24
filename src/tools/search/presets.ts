/**
 * Common preset filters for Target Process search
 */
export const searchPresets = {
  // Status-based filters
  open: 'EntityState.Name eq "Open"',
  inProgress: 'EntityState.Name eq "In Progress"',
  done: 'EntityState.Name eq "Done"',
  
  // Assignment-based filters
  myTasks: 'AssignedUser.Email eq "${currentUser}"',
  unassigned: 'AssignedUser is null',
  
  // Project-based filters
  projectItems: 'Project.Id eq ${projectId}',
  
  // Priority-based filters
  highPriority: 'Priority.Name eq "High"',
  
  // Time-based filters
  createdToday: 'CreateDate gt @Today',
  modifiedToday: 'ModifyDate gt @Today',
  createdThisWeek: 'CreateDate gt @StartOfWeek',
  modifiedThisWeek: 'ModifyDate gt @StartOfWeek',
  createdLastWeek: 'CreateDate gt @StartOfLastWeek and CreateDate lt @StartOfWeek',
  modifiedLastWeek: 'ModifyDate gt @StartOfLastWeek and ModifyDate lt @StartOfWeek',
  
  // Combined filters
  myOpenTasks: 'AssignedUser.Email eq "${currentUser}" and EntityState.Name eq "Open"',
  highPriorityUnassigned: 'Priority.Name eq "High" and AssignedUser is null',
  myRecentTasks: 'AssignedUser.Email eq "${currentUser}" and ModifyDate gt @Today'
} as const;

/**
 * Documentation for date macros:
 * @Today - Current date
 * @StartOfWeek - Beginning of current week
 * @StartOfLastWeek - Beginning of previous week
 * 
 * These are TargetProcess built-in date macros that are evaluated at query time
 */

/**
 * Helper function to apply variable substitution to preset filters
 * 
 * @param preset - The preset filter to use (e.g., 'myTasks', 'projectItems')
 * @param variables - Object containing variable values to substitute
 *                   Common variables: currentUser, projectId
 * 
 * Example:
 * ```typescript
 * // Search for my tasks in project 123
 * const filter = applyPresetFilter('myTasks', { currentUser: 'john.doe@example.com' })
 * ```
 */
export function applyPresetFilter<T extends keyof typeof searchPresets>(
  preset: T,
  variables: Record<string, string | number>
): string {
  let filter = searchPresets[preset] as string;
  
  // Replace each variable in the filter string
  for (const [key, value] of Object.entries(variables)) {
    filter = filter.replace(`\${${key}}`, String(value));
  }
  
  return filter;
}

/**
 * Example usage documentation
 */
export const presetExamples = {
  basic: [
    'search_entities({ type: "UserStory", where: searchPresets.open })',
    'search_entities({ type: "Bug", where: searchPresets.highPriority })'
  ],
  withVariables: [
    'search_entities({ type: "Task", where: applyPresetFilter("myTasks", { currentUser: "user@example.com" }) })',
    'search_entities({ type: "Feature", where: applyPresetFilter("projectItems", { projectId: 123 }) })'
  ],
  combined: [
    'search_entities({ type: "Bug", where: searchPresets.myOpenTasks })',
    'search_entities({ type: "UserStory", where: searchPresets.highPriorityUnassigned })'
  ]
};
