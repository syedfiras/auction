import express from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabase, must } from '../config/db.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
});
const PLAYER_PHOTOS_BUCKET = process.env.SUPABASE_PLAYER_PHOTOS_BUCKET || 'player-photos';

router.use(authenticate);
router.use(requireRole(['player']));

router.post('/register', upload.single('photo'), async (req, res) => {
  const { full_name, age, phone, position, preferred_foot, tournament_id } = req.body;
  if (!full_name || !age || !phone || !position || !preferred_foot || !tournament_id || !req.file) {
    return res.status(400).json({ error: 'All player details and a photo are required' });
  }

  const extension = req.file.originalname.split('.').pop() || 'jpg';
  const filePath = `${tournament_id}/${req.user.id}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(PLAYER_PHOTOS_BUCKET)
    .upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: publicUrl } = supabase.storage
    .from(PLAYER_PHOTOS_BUCKET)
    .getPublicUrl(filePath);

  const player = await must(await supabase
    .from('players')
    .insert({
      full_name,
      age: Number(age),
      phone,
      position,
      preferred_foot,
      photo_url: publicUrl.publicUrl,
      tournament_id,
      registered_by: req.user.id,
      status: 'pending',
    })
    .select('*')
    .single());
  res.json(player);
});

router.get('/my-registration', async (req, res) => {
  const player = await must(await supabase
    .from('players')
    .select('*, teams(name)')
    .eq('registered_by', req.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle());
  res.json(player ? { ...player, team_name: player.teams?.name || null } : null);
});

export default router;
