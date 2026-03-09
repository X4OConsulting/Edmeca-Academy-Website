---
name: new-portal-tool
description: 'Scaffold a new portal tool page with Supabase persistence, TanStack Query data fetching, loading/error states, and the standard EdMeCa portal layout.'
argument-hint: 'Tool name and purpose (e.g. CashFlowTool — helps students project monthly cash flow)'
---

Create a new portal tool named **${input:toolName}** that **${input:purpose}**.

## Steps

### 1. Add the tool type to the shared schema
In `shared/schema.ts`, add `"${input:toolType}"` to the `toolType` enum (or equivalent TOOL_TYPES constant). Use snake_case (e.g. `cash_flow`).

### 2. Add query keys
In `client/src/lib/queryKeys.ts`, add the new tool's artifact key using the existing factory pattern:
```ts
byType: (type: string) => [...queryKeys.artifacts.all, type] as const,
```
No raw string arrays anywhere else.

### 3. Create the service method (if needed)
In `client/src/lib/services.ts`, add a save/load method following the existing `artifactsService` pattern. Always:
- Pass the authenticated user's ID
- Return typed data (no `any`)
- Use the centralized Supabase client

### 4. Create the page component
Create `client/src/pages/portal/${input:toolName}.tsx`:

```tsx
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { artifactsService } from "@/lib/services";
import { PageLoader, PageError } from "@/components/portal/PageStates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ${input:toolName}() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.artifacts.byType("${input:toolType}"),
    queryFn: () => artifactsService.getArtifactByType("${input:toolType}"),
    enabled: !!user,
    networkMode: "always",
  });

  const mutation = useMutation({
    mutationFn: (payload: unknown) =>
      artifactsService.saveArtifact({ toolType: "${input:toolType}", content: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artifacts.all });
    },
    onError: (err) => {
      console.error("Save failed:", err);
    },
  });

  if (isLoading) return <PageLoader message="Loading your ${input:toolName}..." />;
  if (isError) return <PageError message="Could not load your work. Please check your connection." onRetry={refetch} />;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">${input:toolName}</h1>
      {/* Tool UI here */}
    </div>
  );
}
```

### 5. Register the route
In `client/src/App.tsx`, add the route inside `<Switch>` wrapped in `<ProtectedRoute>` and `<ErrorBoundary>`:
```tsx
import ${input:toolName} from "@/pages/portal/${input:toolName}";
// Inside Switch:
<Route path="/portal/tools/${input:toolSlug}">
  <ProtectedRoute>
    <ErrorBoundary>
      <${input:toolName} />
    </ErrorBoundary>
  </ProtectedRoute>
</Route>
```

### 6. Add to the Dashboard learning path (if applicable)
In `client/src/pages/portal/Dashboard.tsx`, add an entry to `LEARNING_PATH` and to the `tools` grid array.

### 7. Type-check
```sh
npm run check
```

## Quality Checklist
- [ ] Route registered in `App.tsx` behind `<ProtectedRoute>` and `<ErrorBoundary>`
- [ ] `isLoading` → `<PageLoader>` and `isError` → `<PageError onRetry>` guards present
- [ ] Query uses `queryKeys` factory — no raw string arrays
- [ ] `networkMode: "always"` set on the query
- [ ] Mutation has `onError` handler
- [ ] Tool type added to `shared/schema.ts`
- [ ] Dashboard updated to surface the new tool
- [ ] No `any` types
- [ ] `npm run check` passes
