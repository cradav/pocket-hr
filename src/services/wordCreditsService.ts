import { supabase } from "@/lib/supabaseClient";

export const WordCreditsService = {
  async getUserCredits(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('word_credits_total, word_credits_remaining')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserCredits(userId: string, wordsUsed: number) {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('word_credits_remaining')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const remainingCredits = user.word_credits_remaining - wordsUsed;
    if (remainingCredits < 0) {
      throw new Error('Insufficient word credits');
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ word_credits_remaining: remainingCredits })
      .eq('id', userId);

    if (updateError) throw updateError;
    return remainingCredits;
  },

  async hasEnoughCredits(userId: string, estimatedWords: number) {
    const { data: user, error } = await supabase
      .from('users')
      .select('word_credits_remaining')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return user.word_credits_remaining >= estimatedWords;
  }
}; 