-- Fix missing DELETE policy for contracts table
-- This allows authenticated users to delete their own contracts

create policy "Users can delete own contracts" 
on contracts 
for delete 
using (auth.uid() = user_id);
