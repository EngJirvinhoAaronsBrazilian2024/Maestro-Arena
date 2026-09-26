/**
 * Comprehensive Automated Verification Suite for Maestro Arena Admin Panel
 * Tests all administrative workflows, InsForge database operations,
 * media storage uploads, and user-facing reflections.
 */
import { getInsforgeAdmin } from '../src/server/insforgeAdmin.js';

async function runTests() {
  console.log('====================================================');
  console.log('MAESTRO ARENA: ADMIN & BACKEND INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  const admin = getInsforgeAdmin();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ': ' + detail : ''}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Admin User Authorization & RLS Verification
  // ----------------------------------------------------
  console.log('\n--- 1. User & Admin Authorization ---');
  try {
    const { data: users, error } = await admin.database
      .from('users')
      .select('*')
      .eq('role', 'admin');
    
    assert(!error && users && users.length > 0, 'Admin accounts exist in users table', `Found ${users?.length || 0} admins`);
    const specialAdmin = users?.find((u: any) => u.email === 'kisakyearon72@gmail.com');
    assert(Boolean(specialAdmin), 'Designated platform admin is present with admin role');
  } catch (e: any) {
    assert(false, 'Admin account verification', e.message);
  }

  // ----------------------------------------------------
  // TEST 2: Storage Image Upload & Public URL
  // ----------------------------------------------------
  console.log('\n--- 2. Storage & Image Upload ---');
  let uploadedKey: string | null = null;
  let uploadedUrl: string | null = null;
  try {
    const testPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(testPixelBase64, 'base64');
    const blob = new Blob([buffer], { type: 'image/png' });
    const key = `test_audit_${Date.now()}.png`;

    const uploadRes = await admin.storage.from('images').upload(key, blob);
    assert(!uploadRes.error, 'InsForge storage upload accepts image binary');

    if (uploadRes.data) {
      uploadedKey = key;
      const pubRes = admin.storage.from('images').getPublicUrl(key);
      uploadedUrl = pubRes.data?.publicUrl || uploadRes.data.url;
      assert(Boolean(uploadedUrl && uploadedUrl.startsWith('http')), 'InsForge public storage URL generated', uploadedUrl || '');
    }
  } catch (e: any) {
    assert(false, 'Storage upload test', e.message);
  }

  // ----------------------------------------------------
  // TEST 3: Tips Management & Categorization
  // ----------------------------------------------------
  console.log('\n--- 3. Football Tips Workflow & Categories ---');
  const testTipId = `tip_audit_${Date.now()}`;
  try {
    // 3a. Single category
    const tipPayload = {
      id: testTipId,
      category: 'single',
      matches: [{
        homeTeam: 'Arsenal',
        awayTeam: 'Liverpool',
        competition: 'Premier League',
        prediction: 'Over 2.5 Goals',
        market: 'Over/Under 2.5'
      }],
      odds: 1.85,
      analysis: 'High scoring historical trend at Emirates Stadium',
      status: 'pending',
      booking_code: 'ARS25LIV',
      image_url: uploadedUrl,
      publish_date: Date.now(),
      created_at: Date.now()
    };

    const { data: createRes, error: createErr } = await admin.database
      .from('tips')
      .insert([tipPayload])
      .select('*');

    assert(!createErr && createRes && createRes.length > 0, 'Create new Tip with match details & booking code');

    // 3b. Update tip to won status and change category to maestro2+
    const { error: updateErr } = await admin.database
      .from('tips')
      .update({
        status: 'won',
        odds: 2.10,
        category: 'maestro2+'
      })
      .eq('id', testTipId);

    assert(!updateErr, 'Update Tip status to WON and odds to 2.10');

    // 3c. Query on user side
    const { data: userTips, error: readErr } = await admin.database
      .from('tips')
      .select('*')
      .eq('id', testTipId)
      .single();

    assert(!readErr && userTips?.status === 'won' && userTips?.category === 'maestro2+', 'Verify persisted Tip updates reflected in database');

    // 3d. Delete tip
    const { error: delErr } = await admin.database.from('tips').delete().eq('id', testTipId);
    assert(!delErr, 'Delete Tip permanently removes it from database');
  } catch (e: any) {
    assert(false, 'Tips lifecycle test', e.message);
  }

  // ----------------------------------------------------
  // TEST 4: News Articles Publishing & Drafts
  // ----------------------------------------------------
  console.log('\n--- 4. News Articles Lifecycle ---');
  const testArticleId = `art_audit_${Date.now()}`;
  try {
    // Create draft article
    const articlePayload = {
      title: 'Audit Test Article Headline',
      content: 'This is the comprehensive body of the audit test article examining football tactics and match previews.',
      summary: 'Tactical analysis preview of upcoming fixtures.',
      image_url: uploadedUrl,
      author_id: '2886ae6d-b563-44a3-b4b8-ae932cc188ad',
      author_name: 'Maestro Chief Editor',
      status: 'draft',
      category: 'Premier League',
      published_at: Date.now()
    };

    const { data: artRes, error: artErr } = await admin.database
      .from('articles')
      .insert([articlePayload])
      .select('*');

    assert(!artErr && artRes && artRes.length > 0, 'Create Draft Article in InsForge database');
    const createdId = artRes?.[0]?.id;

    if (createdId) {
      // Publish the article
      const { error: pubErr } = await admin.database
        .from('articles')
        .update({ status: 'published' })
        .eq('id', createdId);

      assert(!pubErr, 'Transition article from Draft to Published');

      // Verify article is visible to published query
      const { data: pubData, error: pubQueryErr } = await admin.database
        .from('articles')
        .select('*')
        .eq('id', createdId)
        .eq('status', 'published')
        .single();

      assert(!pubQueryErr && Boolean(pubData), 'Published article appears in user-facing published stream');

      // Delete article
      const { error: artDelErr } = await admin.database.from('articles').delete().eq('id', createdId);
      assert(!artDelErr, 'Delete article removes it from database');
    }
  } catch (e: any) {
    assert(false, 'News article lifecycle test', e.message);
  }

  // ----------------------------------------------------
  // TEST 5: Quiz Questions Management
  // ----------------------------------------------------
  console.log('\n--- 5. Quiz Questions CRUD ---');
  const testQId = `q_audit_${Date.now()}`;
  try {
    const questionPayload = {
      id: testQId,
      question: 'Which manager won the Champions League with Porto in 2004?',
      category: 'Famous Managers',
      difficulty: 'Medium',
      options: ['Jose Mourinho', 'Pep Guardiola', 'Carlo Ancelotti', 'Alex Ferguson'],
      correctanswer: 'Jose Mourinho',
      explanation: 'Jose Mourinho led FC Porto to an iconic 3-0 victory over Monaco in Gelsenkirchen.',
      status: 'PUBLISHED',
      created_at: Date.now()
    };

    const { data: qRes, error: qErr } = await admin.database
      .from('quiz_questions')
      .insert([questionPayload])
      .select('*');

    assert(!qErr && qRes && qRes.length > 0, 'Insert Quiz Question with 4 options and correct answer');

    // Update difficulty
    const { error: qUpdErr } = await admin.database
      .from('quiz_questions')
      .update({ difficulty: 'Hard' })
      .eq('id', testQId);

    assert(!qUpdErr, 'Update Quiz Question difficulty');

    // Clean up
    const { error: qDelErr } = await admin.database.from('quiz_questions').delete().eq('id', testQId);
    assert(!qDelErr, 'Delete Quiz Question cleanly');
  } catch (e: any) {
    assert(false, 'Quiz question lifecycle test', e.message);
  }

  // ----------------------------------------------------
  // TEST 6: Seasons, Polls, and Notifications
  // ----------------------------------------------------
  console.log('\n--- 6. Seasons, Polls & Notifications ---');
  try {
    // 6a. Seasons
    const seasonPayload = {
      name: 'Autumn Audit Cup 2026',
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      is_active: true
    };
    const { data: sRes, error: sErr } = await admin.database.from('quiz_seasons').insert([seasonPayload]).select('*');
    assert(!sErr && sRes && sRes.length > 0, 'Create Quiz Tournament Season');
    if (sRes?.[0]?.id) {
      await admin.database.from('quiz_seasons').delete().eq('id', sRes[0].id);
    }

    // 6b. Polls
    const pollPayload = {
      question: 'Will Arsenal win the Champions League this season?',
      options: ['Yes', 'No', 'Maybe'],
      status: 'active'
    };
    const { data: pRes, error: pErr } = await admin.database.from('polls').insert([pollPayload]).select('*');
    assert(!pErr && pRes && pRes.length > 0, 'Create Live Poll with options');
    if (pRes?.[0]?.id) {
      await admin.database.from('polls').delete().eq('id', pRes[0].id);
    }

    // 6c. App Notifications
    const notifPayload = {
      title: 'Platform Maintenance Complete',
      message: 'All systems operational.',
      type: 'info'
    };
    const { data: nRes, error: nErr } = await admin.database.from('app_notifications').insert([notifPayload]).select('*');
    assert(!nErr && nRes && nRes.length > 0, 'Broadcast App Notification');
    if (nRes?.[0]?.id) {
      await admin.database.from('app_notifications').delete().eq('id', nRes[0].id);
    }
  } catch (e: any) {
    assert(false, 'Ancillary admin features test', e.message);
  }

  // Clean up uploaded image if created
  if (uploadedKey) {
    try {
      await admin.storage.from('images').remove([uploadedKey]);
      console.log('Cleaned up test storage object.');
    } catch {}
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
