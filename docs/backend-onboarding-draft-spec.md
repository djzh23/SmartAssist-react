# Backend Spec — Onboarding Draft & Coach Tour

Project: `SmartAssistApi` (C:\Dev\projects\_active\SmartAssistApi)
Auth: existing Clerk JWT middleware (same as all `/api/profile` routes)

---

## 1. Schema / Entity changes

Extend the `CareerProfile` table (or EF Core entity `CareerProfileEntity`):

| Column | Type | Default | Notes |
|---|---|---|---|
| `OnboardingDraftJson` | `TEXT` / `nvarchar(max)` | `NULL` | JSON blob, see shape below |
| `OnboardingCoachTourCompleted` | `bit` / `bool` | `false` | Set to true once tour is dismissed |

### OnboardingDraftJson shape (deserialize as-needed)

```json
{
  "field": "it",
  "level": "mid",
  "currentRole": "Frontend Developer",
  "goals": ["new_job", "interview_prep"],
  "lastStep": 2,
  "updatedAt": "2026-05-04T10:30:00Z"
}
```

All fields are optional/nullable. `lastStep` is informational (FE currently ignores it on restore).

---

## 2. New endpoints

### GET /api/profile/onboarding/draft

Returns the current draft, or an empty object `{}` if none exists.

**Response 200:**
```json
{
  "field": "it",
  "level": "mid",
  "currentRole": "Frontend Developer",
  "goals": ["new_job"],
  "lastStep": 1,
  "updatedAt": "2026-05-04T10:30:00Z"
}
```
Or `{}` when no draft saved yet. Never 404.

---

### PUT /api/profile/onboarding/draft

Saves (upserts) the draft. Does **not** set `onboarding_completed`.

**Request body:**
```json
{
  "field": "it",
  "level": "mid",
  "currentRole": "Frontend Developer",
  "goals": ["new_job"],
  "lastStep": 2
}
```
All fields optional. Server sets `updatedAt` = now.

**Response:** 204 No Content

---

### POST /api/profile/onboarding (existing — no change needed)

Already sets `onboarding_completed = true` and merges final profile fields.
Optionally: clear `OnboardingDraftJson = NULL` here after success.

---

### POST /api/profile/onboarding/coach-tour/done

Sets `OnboardingCoachTourCompleted = true` for the current user.
Called when the user finishes or skips the coach tour overlay.

**Request body:** (empty)

**Response:** 204 No Content

---

## 3. DTO additions

In `GET /api/profile` response DTO (`CareerProfileDto`), add:

```csharp
public bool OnboardingCoachTourCompleted { get; set; }
```

(Default `false` for existing rows — EF migration default handles this.)

The FE reads `profile.onboardingCoachTourCompleted` after `completeOnboarding` to decide whether to show the coach tour overlay.

---

## 4. EF Core migration (example)

```csharp
migrationBuilder.AddColumn<string>(
    name: "OnboardingDraftJson",
    table: "CareerProfiles",
    nullable: true);

migrationBuilder.AddColumn<bool>(
    name: "OnboardingCoachTourCompleted",
    table: "CareerProfiles",
    nullable: false,
    defaultValue: false);
```

---

## 5. Acceptance criteria

- New user completes step 1 → PUT draft → browser closed → re-open /onboarding → fields pre-filled.
- POST /api/profile/onboarding → `onboarding_completed = true`; subsequent GET /api/profile returns `onboardingCompleted: true`.
- POST coach-tour/done → subsequent GET /api/profile returns `onboardingCoachTourCompleted: true` → tour not shown again.
- Existing users (rows created before migration) get `onboardingCoachTourCompleted = false` and see the tour once on next login after completing onboarding.
