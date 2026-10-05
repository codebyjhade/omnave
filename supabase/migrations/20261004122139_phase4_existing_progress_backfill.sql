-- Preserve the best known streak when introducing the dedicated high-water mark.
update public.profiles
set highest_streak = greatest(highest_streak, current_streak)
where highest_streak < current_streak;
