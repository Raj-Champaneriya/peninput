using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

public class HandwrittenNotesService
{
    private readonly IMSDbContext _context;

    public HandwrittenNotesService(IMSDbContext context)
    {
        _context = context;
    }

    public async Task<List<HandwrittenNote>> GetNotesAsync() => await _context.HandwrittenNotes.ToListAsync();

    public async Task<HandwrittenNote?> GetNoteByTitleAsync(string title)
    {
        return await _context.HandwrittenNotes.FirstOrDefaultAsync(n => n.Title == title);
    }

    public async Task AddNoteAsync(HandwrittenNote note)
    {
        Console.WriteLine($"📌 Attempting to save note: {note.Title}");

        _context.HandwrittenNotes.Add(note);
        int savedRecords = await _context.SaveChangesAsync();

        if (savedRecords > 0)
        {
            Console.WriteLine($"✅ Note saved: {note.Id}");
        }
        else
        {
            Console.WriteLine("❌ ERROR: SaveChangesAsync() did not insert the note.");
        }
    }


    public async Task UpdateNoteAsync(Guid noteId, string title, string svgData)
    {
        var note = await _context.HandwrittenNotes.FindAsync(noteId);
        if (note != null)
        {
            if (note.SVGData == svgData && note.Title == title)
            {
                Console.WriteLine("⚠️ No changes detected, skipping update.");
                return;
            }

            note.Title = title;
            note.SVGData = svgData;
            await _context.SaveChangesAsync();
            Console.WriteLine($"🔄 Updated note: {noteId}");
        }
        else
        {
            Console.WriteLine($"❌ Note ID {noteId} not found in DB!");
        }
    }
}
