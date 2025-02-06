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

    public async Task AddNoteAsync(HandwrittenNote note)
    {
        _context.HandwrittenNotes.Add(note);
        await _context.SaveChangesAsync();
    }
    public async Task UpdateNoteAsync(Guid noteId, string title, string svgData)
    {
        var note = await _context.HandwrittenNotes.FindAsync(noteId);
        if (note != null)
        {
            if (note.SVGData != svgData) // Only update if there's a change
            {
                note.Title = title;
                note.SVGData = svgData;
                note.CreatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }
}
